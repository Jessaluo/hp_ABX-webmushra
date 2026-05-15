from pathlib import Path

voices = ["male", "female"]

pairs = [
    ("withinAKG", "noHP", "akg0"),
    ("withinAKG", "noHP", "akg12"),
    ("withinAKG", "noHP", "akg30"),
    ("withinAKG", "noHP", "akg45"),
    ("withinAKG", "noHP", "akg60"),

    ("withinDIY", "noHP", "diy12"),
    ("withinDIY", "noHP", "diy30"),
    ("withinDIY", "noHP", "diy45"),

    ("sennheiserDummy", "noHP", "hd650"),
]

n_repeats = 3  # number of repeats

audio_base = "configs/resources/audio/hp_audio"

out = []

out.append("    -")
out.append("      - random")
out.append("")

for repeat in range(1, n_repeats + 1):
    for voice in voices:
        for group, ref, stim in pairs:
            trial_id = f"test_{group}_{ref}_vs_{stim}_{voice}_r{repeat:02d}"
            name = "Listening Trial"
            stim_label = f"{stim}_{voice[0]}_r{repeat:02d}"

            out.extend([
                "      - type: paired_comparison",
                f"        id: {trial_id}",
                f"        name: {name}",
                "        content: |",
                "          <p>Listen to X, A, and B. Decide whether X is identical to A or B.</p>",
                "        showWaveform: true",
                "        enableLooping: true",
                f"        reference: {audio_base}/{voice}/{ref}.wav",
                "        stimuli:",
                f"          {stim_label}: {audio_base}/{voice}/{stim}.wav",
                "",
            ])

Path("generated_trials.yaml").write_text("\n".join(out))
print("Wrote generated_trials.yaml")
