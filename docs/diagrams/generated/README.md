# Generated PNG Diagrams

This directory contains auto-generated PNG images from PlantUML (`.puml`) files.

## How It Works

- **On PR Creation**: PlantUML files are validated for syntax errors
- **On PR Merge**: PNG diagrams are automatically generated and saved here
- **Directory Structure**: Maintains the same subdirectory structure as the source `.puml` files

## Directory Structure

```
generated/
├── architecture/     # PNGs from docs/diagrams/architecture/*.puml
├── sequence/         # PNGs from docs/diagrams/sequence/*.puml
├── class/            # PNGs from docs/diagrams/class/*.puml
├── deployment/       # PNGs from docs/diagrams/deployment/*.puml
├── state/            # PNGs from docs/diagrams/state/*.puml
├── activity/         # PNGs from docs/diagrams/activity/*.puml
└── use-cases/        # PNGs from docs/diagrams/use-cases/*.puml
```

## Image Quality

- **Resolution**: 300 DPI (high quality)
- **Format**: PNG
- **Character Encoding**: UTF-8

## Manual Generation

To manually generate PNGs locally:

```bash
# Install PlantUML (requires Java)
# macOS: brew install plantuml
# Linux: apt-get install plantuml

# Generate PNGs
find docs/diagrams -name "*.puml" -type f | while read puml_file; do
  rel_path=$(echo "$puml_file" | sed 's|^docs/diagrams/||' | sed 's|\.puml$||')
  subdir=$(dirname "$rel_path")
  mkdir -p "docs/diagrams/generated/$subdir"
  plantuml -tpng -SDPI=300 -o "docs/diagrams/generated/$subdir" "$puml_file"
done
```

## Notes

- PNG files in this directory are auto-generated and should not be edited manually
- To update PNGs, modify the corresponding `.puml` file and merge to main/develop
- This directory is tracked in git to preserve generated diagrams

