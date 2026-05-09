import pathlib

import ipywidgets as w
import yaml

ROLES = ["", "vgae", "gat", "kd", "neutral"]
_DESC = {"description_width": "auto"}


class SpecEditorIPyw(w.VBox):
    """ipywidgets-based spec.yaml editor for JupyterLab fallback use."""

    def __init__(self, spec_path: str | pathlib.Path):
        self._path = pathlib.Path(spec_path)
        self._load_spec()
        self._pending: dict[str, dict] = {}
        children = self._build_ui()
        super().__init__(children=children)

    # ------------------------------------------------------------------
    # Internal state
    # ------------------------------------------------------------------

    def _load_spec(self) -> None:
        self._spec = yaml.safe_load(self._path.read_text())
        self._bridges: list[dict] = list(self._spec.get("bridges", []))

    # ------------------------------------------------------------------
    # UI construction
    # ------------------------------------------------------------------

    def _build_ui(self) -> list:
        comp_ids = list(self._spec.get("components", {}).keys())

        # --- component editor ---
        self._comp_sel = w.Dropdown(
            options=comp_ids,
            description="Component:",
            style=_DESC,
            layout=w.Layout(width="320px"),
        )
        self._label_in = w.Text(
            description="Label:",
            style=_DESC,
            layout=w.Layout(width="320px"),
        )
        self._role_sel = w.Dropdown(
            options=ROLES,
            description="Role:",
            style=_DESC,
            layout=w.Layout(width="320px"),
        )
        self._apply_btn = w.Button(
            description="Apply",
            button_style="info",
            layout=w.Layout(width="90px"),
        )
        self._pending_lbl = w.Label("", layout=w.Layout(margin="0 0 0 8px"))

        self._comp_sel.observe(self._on_comp_change, names="value")
        self._apply_btn.on_click(self._on_apply)
        self._sync_comp_fields()

        comp_section = w.VBox(
            [
                w.HTML("<b>Component</b>"),
                self._comp_sel,
                self._label_in,
                self._role_sel,
                w.HBox([self._apply_btn, self._pending_lbl]),
            ],
            layout=w.Layout(border="1px solid #ddd", padding="8px", margin="4px 0"),
        )

        # --- bridge editor ---
        self._bridge_from = w.Dropdown(
            options=comp_ids,
            description="From:",
            style=_DESC,
            layout=w.Layout(width="220px"),
        )
        self._bridge_to = w.Dropdown(
            options=comp_ids,
            description="To:",
            style=_DESC,
            layout=w.Layout(width="220px"),
        )
        self._add_btn = w.Button(description="+ Add", layout=w.Layout(width="70px"))
        self._bridge_rows = w.VBox([])
        self._add_btn.on_click(self._on_add_bridge)
        self._refresh_bridges()

        bridge_section = w.VBox(
            [
                w.HTML("<b>Bridges</b>"),
                self._bridge_rows,
                w.HBox([self._bridge_from, self._bridge_to, self._add_btn]),
            ],
            layout=w.Layout(border="1px solid #ddd", padding="8px", margin="4px 0"),
        )

        # --- save / reload ---
        self._save_btn = w.Button(description="Save to spec.yaml", button_style="success")
        self._reload_btn = w.Button(description="Reload", button_style="warning")
        self._status = w.Label("")
        self._save_btn.on_click(self._on_save)
        self._reload_btn.on_click(self._on_reload)

        return [
            comp_section,
            bridge_section,
            w.HBox([self._save_btn, self._reload_btn, self._status]),
        ]

    # ------------------------------------------------------------------
    # Component callbacks
    # ------------------------------------------------------------------

    def _sync_comp_fields(self) -> None:
        comp_id = self._comp_sel.value
        if not comp_id:
            return
        comp = self._spec["components"].get(comp_id, {})
        pending = self._pending.get(comp_id, {})
        self._label_in.value = pending.get("label", comp.get("label", comp_id))
        role = pending.get("role", comp.get("role", ""))
        self._role_sel.value = role if role in ROLES else ""

    def _on_comp_change(self, change: dict) -> None:
        self._sync_comp_fields()

    def _on_apply(self, _) -> None:
        comp_id = self._comp_sel.value
        if not comp_id:
            return
        orig = self._spec["components"].get(comp_id, {})
        changes: dict = {}
        if self._label_in.value != orig.get("label", comp_id):
            changes["label"] = self._label_in.value
        if self._role_sel.value != orig.get("role", ""):
            changes["role"] = self._role_sel.value
        if changes:
            self._pending[comp_id] = {**self._pending.get(comp_id, {}), **changes}
        n = len(self._pending)
        self._pending_lbl.value = f"{n} component(s) pending" if n else ""

    # ------------------------------------------------------------------
    # Bridge callbacks
    # ------------------------------------------------------------------

    def _refresh_bridges(self) -> None:
        rows = []
        for i, b in enumerate(self._bridges):
            lbl = w.Label(f"{b['from']}  →  {b['to']}", layout=w.Layout(width="240px"))
            rm = w.Button(description="✕", layout=w.Layout(width="36px", padding="0"))
            rm.on_click(lambda _, idx=i: self._remove_bridge(idx))
            rows.append(w.HBox([lbl, rm]))
        self._bridge_rows.children = (
            rows if rows else [w.HTML('<span style="color: #aaa">No bridges.</span>')]
        )

    def _on_add_bridge(self, _) -> None:
        self._bridges.append({"from": self._bridge_from.value, "to": self._bridge_to.value})
        self._refresh_bridges()

    def _remove_bridge(self, idx: int) -> None:
        self._bridges.pop(idx)
        self._refresh_bridges()

    # ------------------------------------------------------------------
    # Save / reload
    # ------------------------------------------------------------------

    def _on_save(self, _) -> None:
        spec = yaml.safe_load(self._path.read_text())
        for comp_id, changes in self._pending.items():
            if comp_id in spec.get("components", {}):
                spec["components"][comp_id].update(changes)
        spec["bridges"] = self._bridges
        self._path.write_text(yaml.dump(spec, allow_unicode=True, sort_keys=False))
        self._pending = {}
        self._pending_lbl.value = ""
        self._status.value = f"✓ Saved → {self._path.name}"

    def _on_reload(self, _) -> None:
        self._load_spec()
        self._pending = {}
        self._pending_lbl.value = ""
        self._status.value = "Reloaded."
        self._sync_comp_fields()
        self._refresh_bridges()

    def save(self) -> None:
        self._on_save(None)

    def reload(self) -> None:
        self._on_reload(None)
