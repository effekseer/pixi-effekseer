
class EffekseerRenderer extends PIXI.Sprite
{
  constructor()
  {
    super();
    this._gl = null;
  }

  _init()
  {
    effekseer.init(this._gl);
	effekseer.setProjectionOrthographic(this._windowWidth, this._windowHeight, 0.1, 100.0);
	effekseer.setCameraLookAt(0.0, 0.0, 10.0, 0.0, 0.0, 0.0,0.0,1.0,0.0);
  }

  _update()
  {
    effekseer.update();
  }

  _render()
  {
    effekseer.draw();
  }

  _renderWebGL(renderer)
  {
    if(this._gl == null)
    {
      this._gl = renderer.gl;
      this._windowWidth = renderer.view.width;
      this._windowHeight = renderer.view.height;
      this._init();
    }

    // Container of pixi does not have update function.
    this._update();
    this._render();

    super._renderWebGL(renderer);
  }
}

class EffekseerEmitter extends PIXI.Sprite
{
  constructor(path)
  {
    super();
      this._gl = null;
      this._path = path;
      this._renderer = null;
      this._effect = null;
      this.handle = null;
      this.isLoaded = false;
  }

  _init()
  {
    this._effect = effekseer.loadEffect(this._path, function(){ this.isLoaded=true; }.bind(this));
  }

  _update()
  {
    if(this.handle == null && this.isLoaded)
    {
      this.handle = effekseer.play(this._effect);
      this.handle.setScale( 20.0, 20.0, 20.0 );
    }
  }

  _renderWebGL(renderer)
  {
    if(this._gl == null)
    {
      this._gl = renderer.gl;
      this._init();
    }

    // Container of pixi does not have update function.
    this._update();
    super._renderWebGL(renderer);
  }
}

if (PIXI)
{
  PIXI.EffekseerRenderer = EffekseerRenderer;
  PIXI.EffekseerEmitter = EffekseerEmitter;
}
else
{
  console.error('Error: Cannot find global variable `PIXI`, Effekseer plguin will not be installed.');
}