import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, List

FAULT_CLASSES = {
    0: "Normal Baseline",
    1: "Bearing Inner Race Spall",
    2: "Rotor Unbalance",
    3: "Stator Winding Short",
    4: "Shaft Misalignment"
}

MACHINE_PROFILES = {
    "CNC-SPINDLE-01": {"nominal_rpm": 1800.0, "line_freq": 50.0, "base_temp": 41.5, "base_current": 12.0},
    "TURBINE-GEN-04": {"nominal_rpm": 3000.0, "line_freq": 50.0, "base_temp": 48.0, "base_current": 25.0},
    "COMPRESSOR-B2":  {"nominal_rpm": 1500.0, "line_freq": 50.0, "base_temp": 44.0, "base_current": 18.0}
}

def generate_window_signal(
    fault_class: int,
    rpm: float,
    window_size: int = 256,
    fs: float = 1000.0,
    t_start: float = 0.0,
    machine_id: str = "CNC-SPINDLE-01"
) -> Dict[str, np.ndarray]:
    """
    Generates genuine physics-informed multi-sensor time-series for a single 256-sample window.
    fs = 1000 Hz, window_size = 256 (0.256 seconds)
    """
    profile = MACHINE_PROFILES.get(machine_id, MACHINE_PROFILES["CNC-SPINDLE-01"])
    f0 = rpm / 60.0  # Fundamental shaft frequency (e.g., 30 Hz at 1800 RPM)
    f_line = profile["line_freq"]
    rpm_scale = (rpm / profile["nominal_rpm"]) ** 2

    t = t_start + np.arange(window_size) / fs

    # 1. Base deterministic vibrations
    # Normal baseline: fundamental harmonic + low white noise
    vib_x = 0.22 * np.sin(2 * np.pi * f0 * t) + np.random.normal(0, 0.04, window_size)
    vib_y = 0.20 * np.cos(2 * np.pi * f0 * t) + np.random.normal(0, 0.04, window_size)

    # 2. Temperature & Current baselines
    temp = profile["base_temp"] + 0.5 * np.sin(2 * np.pi * 0.05 * t) + np.random.normal(0, 0.08, window_size)
    curr = profile["base_current"] * np.sin(2 * np.pi * f_line * t) + np.random.normal(0, 0.2, window_size)
    acoustic = 48.0 + 1.5 * np.sin(2 * np.pi * f0 * t) + np.random.normal(0, 0.8, window_size)

    # 3. Fault-Specific Physical Signatures
    if fault_class == 1:
        # Bearing Inner Race Spall:
        # BPFI = 5.43 * f0. Causes periodic sharp decaying impulsive impacts
        bpfi = 5.43 * f0
        impulse_period = 1.0 / bpfi
        burst_envelope = np.zeros(window_size)
        
        # Superimpose decaying exponential ringings at impulse intervals
        for idx, ti in enumerate(t):
            phase = (ti % impulse_period)
            if phase < 0.012:  # 12ms ringing decay
                burst_envelope[idx] = np.exp(-phase * 350.0) * np.sin(2 * np.pi * 380.0 * phase)
        
        impact_amp = 3.8 * (rpm / 1800.0)
        vib_x += impact_amp * burst_envelope + np.random.normal(0, 0.12, window_size)
        vib_y += impact_amp * 0.7 * burst_envelope + np.random.normal(0, 0.10, window_size)
        acoustic += 22.0 + 15.0 * np.abs(burst_envelope)
        temp += 4.5

    elif fault_class == 2:
        # Rotor Unbalance:
        # Severe sinusoidal growth strictly at 1x f0 proportional to RPM^2
        unbalance_amp = 3.6 * rpm_scale
        vib_x += unbalance_amp * np.sin(2 * np.pi * f0 * t + 0.3)
        vib_y += unbalance_amp * 0.95 * np.cos(2 * np.pi * f0 * t + 0.3)
        acoustic += 8.0 * rpm_scale
        temp += 3.0

    elif fault_class == 3:
        # Stator Winding Short:
        # Severe current surges, strong 2x line frequency (100Hz) harmonic in current,
        # rapid thermal rise and high electro-thermal stress
        short_current_amp = profile["base_current"] * 2.2
        curr += short_current_amp * np.sin(2 * np.pi * (2 * f_line) * t) + np.random.normal(0, 1.2, window_size)
        # Thermal rise: significantly elevated
        temp += 36.0 + 4.0 * (1.0 - np.exp(-t / 50.0))
        vib_x += 1.2 * np.sin(2 * np.pi * (2 * f_line) * t)
        vib_y += 1.0 * np.cos(2 * np.pi * (2 * f_line) * t)
        acoustic += 12.0

    elif fault_class == 4:
        # Shaft Misalignment:
        # Dominant 2x f0 and 3x f0 axial and radial vibration harmonics
        misalign_2x = 2.4 * rpm_scale
        misalign_3x = 1.6 * rpm_scale
        vib_x += misalign_2x * np.sin(2 * np.pi * 2 * f0 * t) + misalign_3x * np.sin(2 * np.pi * 3 * f0 * t)
        vib_y += misalign_2x * np.cos(2 * np.pi * 2 * f0 * t) + misalign_3x * np.cos(2 * np.pi * 3 * f0 * t)
        acoustic += 14.0 + 3.0 * np.sin(2 * np.pi * 2 * f0 * t)
        temp += 8.0

    return {
        "timestamp": t,
        "rpm": np.full(window_size, rpm),
        "vibration_x_mm_s": vib_x,
        "vibration_y_mm_s": vib_y,
        "temperature_c": temp,
        "motor_current_a": curr,
        "acoustic_db": acoustic,
        "fault_label": np.full(window_size, fault_class, dtype=int)
    }

def generate_synthetic_dataset(
    total_samples: int = 25600,
    window_size: int = 256,
    train_ratio: float = 0.7
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Generates 25,600 synthetic samples (100 windows of 256) across 5 fault classes and 3 machine regimes.
    Splits strictly 70% Train / 30% Chronological Held-Out Test (70 train windows, 30 held-out windows).
    """
    total_windows = total_samples // window_size
    records = []
    t_global = 0.0

    machines = list(MACHINE_PROFILES.keys())

    for w_idx in range(total_windows):
        # 5 balanced classes: 0: Normal, 1: Bearing, 2: Unbalance, 3: Stator, 4: Misalignment
        fault_class = w_idx % 5

        machine_id = machines[(w_idx // 5) % len(machines)]
        nominal_rpm = MACHINE_PROFILES[machine_id]["nominal_rpm"]
        rpm_jitter = nominal_rpm * (1.0 + np.random.uniform(-0.04, 0.04))

        w_data = generate_window_signal(
            fault_class=fault_class,
            rpm=rpm_jitter,
            window_size=window_size,
            fs=1000.0,
            t_start=t_global,
            machine_id=machine_id
        )

        for i in range(window_size):
            records.append({
                "timestamp": float(w_data["timestamp"][i]),
                "machine_id": machine_id,
                "rpm": float(w_data["rpm"][i]),
                "vibration_x_mm_s": float(w_data["vibration_x_mm_s"][i]),
                "vibration_y_mm_s": float(w_data["vibration_y_mm_s"][i]),
                "temperature_c": float(w_data["temperature_c"][i]),
                "motor_current_a": float(w_data["motor_current_a"][i]),
                "acoustic_db": float(w_data["acoustic_db"][i]),
                "fault_label": int(w_data["fault_label"][i])
            })

        t_global += window_size / 1000.0

    df = pd.DataFrame(records)
    train_windows = int(total_windows * train_ratio)
    split_sample_idx = train_windows * window_size
    train_df = df.iloc[:split_sample_idx].copy().reset_index(drop=True)
    held_out_df = df.iloc[split_sample_idx:].copy().reset_index(drop=True)

    return train_df, held_out_df



