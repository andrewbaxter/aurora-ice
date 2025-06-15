import pathlib
import json

here = pathlib.Path.cwd()
out = here / "pack"
out.mkdir(exist_ok=True, parents=True)
source = (here / "index.html").read_text()
shaders = {}
for shader in list(here.glob("*.frag")) + list(here.glob("*.vert")):
    shaders[shader.name] = shader.read_text()
(out / "index.html").write_text(source.replace('"BACKUP_SHADERS"', json.dumps(shaders)))
