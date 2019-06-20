
var renderer = new PIXI.Renderer(512, 512);

document.body.appendChild(renderer.view);

var stage = new PIXI.Container();

var texture = PIXI.Texture.fromImage('Image/icon.png');
var icon = new PIXI.Sprite(texture);
icon.anchor.x = 0.5;
icon.anchor.y = 0.5;
icon.position.x = 256;
icon.position.y = 256;
stage.addChild(icon);

var effekseerRenderer = new PIXI.EffekseerRenderer();
var effekseerEmitter = new PIXI.EffekseerEmitter('Resource/Laser01.efk');

stage.addChild(effekseerRenderer);
stage.addChild(effekseerEmitter);

effekseerEmitter.setPosition(128.0, 128.0)
effekseerEmitter.setScale(20.0, 20.0, 20.0)

// do not play on add automatically
// you need to call effekseerEmitter.play(); with yourself
// effekseerEmitter.playOnAdd = false;

function animate()
{
  requestAnimationFrame(animate);
  renderer.render(stage);
}

requestAnimationFrame(animate);