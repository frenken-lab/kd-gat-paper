import json
import pathlib

import anywidget
import traitlets


class SpecEditor(anywidget.AnyWidget):
    _esm = pathlib.Path(__file__).parent / "dist" / "widget.js"
    _css = pathlib.Path(__file__).parent / "dist" / "kd-gat-paper-figures.css"

    spec = traitlets.Unicode("{}").tag(sync=True)
    patch = traitlets.Unicode("{}").tag(sync=True)

    def __init__(self, spec_path: str | pathlib.Path):
        self._spec_path = pathlib.Path(spec_path)
        super().__init__(spec=self._spec_path.read_text())

    def save(self) -> None:
        """Deep-merge patch into spec.yaml and write back."""
        import yaml

        patch = json.loads(self.patch)
        spec = yaml.safe_load(self._spec_path.read_text())

        for comp_id, changes in patch.get("components", {}).items():
            if comp_id in spec.get("components", {}):
                spec["components"][comp_id].update(changes)

        if "bridges" in patch:
            spec["bridges"] = patch["bridges"]

        self._spec_path.write_text(yaml.dump(spec, allow_unicode=True, sort_keys=False))
        print(f"Saved → {self._spec_path}")

    def reload(self) -> None:
        """Re-read spec.yaml and push to JS (e.g. after a manual edit)."""
        self.spec = self._spec_path.read_text()
