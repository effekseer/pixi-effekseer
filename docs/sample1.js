
var renderer = new PIXI.WebGLRenderer(256, 256);

document.body.appendChild(renderer.view);

var stage = new PIXI.Container();
var effekseerRenderer = new PIXI.EffekseerRenderer();
var effekseerEmitter = new PIXI.EffekseerEmitter('Resource/Laser01.efk');

stage.addChild(effekseerRenderer);
stage.addChild(effekseerEmitter);

renderer.render(stage);