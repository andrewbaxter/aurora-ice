import pathlib
import json

here = pathlib.Path.cwd()
out = here / "build"
out.mkdir(exist_ok=True, parents=True)
source = (here / "index.html").read_text()
shaders = {}
for shader in here.glob("*.frag") + here.glob("*.vert"):
    shaders[shader.filename] = shader.read_text()
(out / "index.html").write_text(
    source.replace_all("BACKUP_SHADERS", json.dumps(shaders))
)
