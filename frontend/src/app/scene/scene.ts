import { Component, ElementRef, ViewChild, AfterViewInit, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Engine, Scene, ArcRotateCamera, HemisphericLight, MeshBuilder, Vector3 } from '@babylonjs/core';

@Component({
  selector: 'app-scene',
  standalone: true,
  template: `<canvas #canvas></canvas>`,
})
export class SceneComponent implements AfterViewInit {

  @ViewChild('canvas', { static: true })
  canvas!: ElementRef<HTMLCanvasElement>;

  private platformId = inject(PLATFORM_ID);

  ngAfterViewInit(): void {

    // SOLO en navegador
    if (!isPlatformBrowser(this.platformId)) return;

    const engine = new Engine(this.canvas.nativeElement, true);
    const scene = new Scene(engine);

    const camera = new ArcRotateCamera(
      'camera',
      Math.PI / 2,
      Math.PI / 2,
      5,
      Vector3.Zero(),
      scene
    );

    camera.attachControl(this.canvas.nativeElement, true);

    new HemisphericLight('light', new Vector3(0, 1, 0), scene);

    MeshBuilder.CreateSphere('sphere', { diameter: 1 }, scene);

    engine.runRenderLoop(() => {
      scene.render();
    });

    window.addEventListener('resize', () => {
      engine.resize();
    });
  }
}