
function main() {
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

  stage.addChild(effekseerRenderer);

  let frameCount = 0;

  function animate() {

    if(frameCount == 100)
    {
      var effect = new PIXI.EffekseerEffect('Resource/Laser01.efk');
      var effekseerEmitter = new PIXI.EffekseerEmitter(effect);
  stage.addChild(effekseerEmitter);

  effekseerEmitter.setPosition(128.0, 128.0)
  effekseerEmitter.setScale(20.0, 20.0, 20.0)

  // do not play on add automatically
  // you need to call effekseerEmitter.play(); with yourself
  // effekseerEmitter.playOnAdd = false;
    }

    requestAnimationFrame(animate);
    renderer.render(stage);

    frameCount += 1;
  }

  requestAnimationFrame(animate);
}

useWASM = true;

if(useWASM) {
  // if you use wasm version
  effekseer.initRuntime('effekseer.wasm', () => {
    main();
  });
} else {
  // if you use asmjs version
  main();
}