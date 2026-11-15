import io, os, re, sys, base64, subprocess

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "coolpath.html")
EDGE = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"

SHIM = """
<script>
(function(){
  window.requestAnimationFrame = function(cb){ return setTimeout(function(){ cb(performance.now()); }, 16); };
  window.cancelAnimationFrame = function(){};
  window.__run = function(opts){
    document.getElementById('simBtn').click();
    setTimeout(function(){
      window.__simTeleport(opts.x, opts.y, opts.a);
      if(opts.pitch !== undefined) window.__setPitch && window.__setPitch(opts.pitch);
      if(opts.keys) opts.keys.forEach(function(k){ window.dispatchEvent(new KeyboardEvent('keydown', {code:k})); });
      setTimeout(function(){
        var c = document.getElementById('simc');
        var img = document.createElement('img');
        img.id = 'shot';
        img.src = c.toDataURL('image/png');
        document.body.innerHTML = '';
        document.body.appendChild(img);
      }, opts.wait || 420);
    }, 260);
  };
})();
</script>
"""

def make(name, opts, w=1180, h=700):
    s = io.open(SRC, encoding="utf-8").read()
    s = s.replace("</body>", SHIM + "<script>setTimeout(function(){ __run(%r); }, 60);</script></body>" % (opts,))
    p = os.path.join(ROOT, "_t_%s.html" % name)
    io.open(p, "w", encoding="utf-8").write(s)
    return p

def shot(name, opts, w=1180, h=700):
    p = make(name, opts, w, h)
    d = os.path.join(ROOT, "_prof_" + name)
    cmd = [EDGE, "--headless=new", "--disable-gpu", "--no-sandbox",
           "--user-data-dir=" + d, "--window-size=%d,%d" % (w, h),
           "--virtual-time-budget=9000", "--dump-dom", "file:///" + p.replace("\\","/")]
    out = subprocess.run(cmd, capture_output=True, timeout=180).stdout.decode("utf-8", "ignore")
    m = re.search(r'src="data:image/png;base64,([^"]+)"', out)
    if not m:
        print("NO IMG", name, len(out))
        io.open(os.path.join(ROOT, "_dump_%s.html" % name), "w", encoding="utf-8").write(out)
        return None
    data = base64.b64decode(m.group(1))
    o = os.path.join(ROOT, "shots", name + ".png")
    os.makedirs(os.path.dirname(o), exist_ok=True)
    io.open(o, "wb").write(data)
    print("saved", o, len(data))
    return o

if __name__ == "__main__":
    which = sys.argv[1] if len(sys.argv) > 1 else "all"
    tests = {
        "start":  {"x":2.5,  "y":12.5, "a":0.0,  "wait":420},
        "street": {"x":4.5,  "y":10.6, "a":-1.35,"wait":420},
        "park":   {"x":12.6, "y":5.4,  "a":0.35, "wait":420},
        "goal":   {"x":13.0, "y":9.75, "a":-1.57,"wait":420},
        "door":   {"x":13.0, "y":9.30, "a":-1.57,"wait":420},
        "arrive": {"x":13.0, "y":9.04, "a":-1.57,"wait":600},
        "gate":   {"x":1.4,  "y":12.15,"a":-1.57,"wait":420},
        "school": {"x":17.1, "y":12.35,"a":-1.57,"wait":420},
        "beam":   {"x":10.5, "y":7.3,  "a":0.75, "wait":420},
        "far":    {"x":17.5, "y":12.42,"a":-2.56,"wait":420},
        "move":   {"x":4.5,  "y":12.3, "a":1.57, "wait":900, "keys":["KeyW"]},
        "walk2":  {"x":9.0,  "y":12.3, "a":1.57, "wait":1100,"keys":["KeyW"]},
        "yard":   {"x":2.7,  "y":11.30,"a":-1.50,"wait":420},
        "yard2":  {"x":2.7,  "y":10.75,"a":-1.57,"wait":420},
        "resc":   {"x":2.6,  "y":7.42, "a":1.50, "wait":420},
        "enter":  {"x":2.6,  "y":12.30,"a":-1.57,"wait":1400,"keys":["KeyW"]},
    }
    keys = [which] if which in tests else list(tests.keys())
    for k in keys:
        shot(k, tests[k])
