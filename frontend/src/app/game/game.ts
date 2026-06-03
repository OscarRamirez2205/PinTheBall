import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { DailyPlayLockService } from '../services/daily-play-lock.service';
import { AuthService } from '../services/auth.service';
import { SelectedBallService } from '../services/selected-ball.service';
import { ShopWalletService } from '../shop/shop-wallet.service';
import { applyBallMaterialToMesh, getBallPbrMaterial } from '../shared/ball-babylon-texture';
import { bindAudioUnlock, createGameSounds, type GameSounds } from '../shared/game-audio';
import { launchGameConfetti } from '../shared/game-confetti';
import { setupSkyPano } from '../shared/game-skybox';
import { API_URL } from '../config/api-url';
import { apiFetch } from '../shared/api-fetch';
import { coinsFromScore } from '../shared/game-rewards';
import * as BABYLON from '@babylonjs/core';
import * as GUI from '@babylonjs/gui';
import '@babylonjs/loaders/glTF';
import { ImportMeshAsync } from '@babylonjs/core/Loading/sceneLoader';
import HavokPhysics from '@babylonjs/havok';
import { HavokPlugin } from '@babylonjs/core/Physics/v2/Plugins/havokPlugin';

interface SavedGameResponse {
  id: number;
  coins_earned?: number;
  wallet?: number;
}

class GameLoadingScreen implements BABYLON.ILoadingScreen {
  loadingUIBackgroundColor = '#080312';
  loadingUIText = 'Cargando PinTheBall...';

  constructor(
    private readonly show: () => void,
    private readonly hide: () => void,
  ) {}

  displayLoadingUI(): void {
    this.show();
  }

  hideLoadingUI(): void {
    this.hide();
  }
}

@Component({
  selector: 'app-game',
  imports: [DecimalPipe],
  templateUrl: './game.html',
  styleUrl: './game.scss',
})

export class Game implements AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly dailyLock = inject(DailyPlayLockService);
  private readonly auth = inject(AuthService);
  private readonly selectedBall = inject(SelectedBallService);
  private readonly shopWallet = inject(ShopWalletService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);
  private engine: BABYLON.Engine | null = null;
  private scene: BABYLON.Scene | null = null;
  private gameSounds: GameSounds | null = null;
  private resizeHandler = () => this.engine?.resize();
  readonly gameOverModalOpen = signal(false);
  readonly gameOverIsGuest = signal(false);
  readonly gameOverScore = signal(0);
  readonly coinsEarned = signal(0);
  readonly guestNameInput = signal('');
  readonly guestNameError = signal('');
  readonly guestSavingName = signal(false);
  readonly gameLoadingVisible = signal(false);
  readonly gameLoadingHidden = signal(false);
  private pendingGuestGameId: number | null = null;
  private loadingHideTimeout: number | null = null;

  @ViewChild('renderCanvas', { static: true })
  private renderCanvasRef!: ElementRef<HTMLCanvasElement>;

  private async saveFinishedGame(
    finalScore: number,
    durationSeconds: number,
  ): Promise<SavedGameResponse> {
    const user = this.auth.getUser();
    return apiFetch<SavedGameResponse>(`${API_URL}/games`, {
      method: 'POST',
      body: JSON.stringify({
        player_id: user?.id ?? null,
        score: finalScore,
        duration: durationSeconds,
      }),
    });
  }

  private openGameOverModal(
    finalScore: number,
    options: { isGuest: boolean; gameId: number | null; coinsEarned: number; wallet?: number },
  ): void {
    this.gameOverScore.set(Math.floor(Math.max(0, finalScore)));
    this.coinsEarned.set(options.coinsEarned);
    this.gameOverIsGuest.set(options.isGuest);
    this.pendingGuestGameId = options.gameId;
    this.guestNameInput.set('');
    this.guestNameError.set('');
    this.gameOverModalOpen.set(true);
    this.engine?.stopRenderLoop();
    launchGameConfetti();

    if (options.wallet !== undefined) {
      this.shopWallet.setWalletBalance(options.wallet);
      const user = this.auth.getUser();
      if (user) {
        this.auth.setUser({ ...user, wallet: options.wallet });
      }
    }
  }

  private showGameLoading(): void {
    if (this.loadingHideTimeout !== null) {
      window.clearTimeout(this.loadingHideTimeout);
      this.loadingHideTimeout = null;
    }
    this.gameLoadingHidden.set(false);
    this.gameLoadingVisible.set(true);
  }

  private hideGameLoading(): void {
    if (!this.gameLoadingVisible()) {
      return;
    }

    this.gameLoadingHidden.set(true);
    this.loadingHideTimeout = window.setTimeout(() => {
      this.gameLoadingVisible.set(false);
      this.loadingHideTimeout = null;
    }, 260);
  }

  private async onGameOver(finalScore: number, durationSeconds: number): Promise<void> {
    const user = this.auth.getUser();
    const isGuest = !user?.id;
    const fallbackCoins = coinsFromScore(finalScore);

    try {
      const saved = await this.saveFinishedGame(finalScore, durationSeconds);
      const coinsEarned = saved.coins_earned ?? fallbackCoins;

      this.ngZone.run(() => {
        this.openGameOverModal(finalScore, {
          isGuest,
          gameId: isGuest ? saved.id : null,
          coinsEarned,
          wallet: saved.wallet,
        });
      });
    } catch {
      this.ngZone.run(() => {
        this.openGameOverModal(finalScore, {
          isGuest,
          gameId: null,
          coinsEarned: fallbackCoins,
        });
        this.guestNameError.set('No se pudo guardar la partida.');
      });
    }
  }

  dismissGameOverModal(): void {
    this.gameOverModalOpen.set(false);
    this.finishDailyRun();
  }

  onGuestNameInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.guestNameInput.set(value);
  }

  async submitGuestName(): Promise<void> {
    const normalized = this.guestNameInput().trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(normalized)) {
      this.guestNameError.set('Introduce un nombre de exactamente 3 letras.');
      return;
    }
    if (this.pendingGuestGameId === null) {
      this.guestNameError.set('No hay partida pendiente para actualizar.');
      return;
    }

    this.guestSavingName.set(true);
    this.guestNameError.set('');
    try {
      await apiFetch(`${API_URL}/games/${this.pendingGuestGameId}`, {
        method: 'PATCH',
        body: JSON.stringify({ guest_name: normalized }),
      });
      this.gameOverModalOpen.set(false);
      this.pendingGuestGameId = null;
      this.finishDailyRun();
    } catch {
      this.guestNameError.set('No se pudo actualizar el nombre de la partida.');
    } finally {
      this.guestSavingName.set(false);
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const user = this.auth.getUser();
    if (user?.id) {
      void this.selectedBall.refreshOwnedBalls(user.id);
    }

    const canvas = this.renderCanvasRef.nativeElement;
    this.engine = new BABYLON.Engine(canvas, true, { audioEngine: true });
    this.engine.loadingScreen = new GameLoadingScreen(
      () => this.ngZone.run(() => this.showGameLoading()),
      () => this.ngZone.run(() => this.hideGameLoading()),
    );
    this.engine.displayLoadingUI();
    this.scene = this.createScene(this.engine, canvas);

    this.engine.runRenderLoop(() => {
      this.scene?.render();
    });

    window.addEventListener('resize', this.resizeHandler);
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    window.removeEventListener('resize', this.resizeHandler);
    if (this.loadingHideTimeout !== null) {
      window.clearTimeout(this.loadingHideTimeout);
      this.loadingHideTimeout = null;
    }
    this.engine?.hideLoadingUI();
    this.gameSounds?.dispose();
    this.gameSounds = null;
    this.scene?.dispose();
    this.engine?.dispose();
  }

  createScene = (engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene => {
      const scene = new BABYLON.Scene(engine);

      const camera = new BABYLON.FreeCamera("camera1", 
          new BABYLON.Vector3(0, 12, -4), 
          scene);

      camera.setTarget(new BABYLON.Vector3(0, 0.9, 0));

      camera.attachControl(canvas, true);

      const light = new BABYLON.HemisphericLight("light", 
          new BABYLON.Vector3(0, 1, 0), 
          scene);

      light.intensity = 0.7;

      void HavokPhysics({
        locateFile: (path: string) =>
          path.endsWith('.wasm') ? '/resources/wasm/HavokPhysics.wasm' : path,
      })
      .then(async (havokInstance) => {
        const hk = new HavokPlugin(true, havokInstance);
        scene.enablePhysics(new BABYLON.Vector3(0, -9.8, 0), hk);
        const [pinballResult] = await Promise.all([
          ImportMeshAsync("./resources/object/pinball/Pinball.glb", scene),
          setupSkyPano(scene),
        ]);

        return pinballResult;
      })
      .then((result) => {
        const root = result.meshes[0];
        root.scaling = new BABYLON.Vector3(-6, 6, 6);
        root.position.y = -4;

        const sfx = createGameSounds();
        this.gameSounds = sfx;
        bindAudioUnlock(canvas, sfx);

        //Sistema de vidas y puntuacion
        let score = 0;
        let livesLeft = 3;
        const runStartedAtMs = Date.now();
        let gameOverHandled = false;
        const maxScore = 99_999_999;
        const maxLives = 3;
        const scoreUi = GUI.AdvancedDynamicTexture.CreateFullscreenUI('score-ui', true, scene);
        const scoreContainer = new GUI.Rectangle('score-container');
        scoreContainer.width = '420px';
        scoreContainer.height = '64px';
        scoreContainer.thickness = 0;
        scoreContainer.cornerRadius = 12;
        scoreContainer.background = '#261447CC';
        scoreContainer.top = '20px';
        scoreContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        scoreContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        scoreUi.addControl(scoreContainer);
        const scoreText = new GUI.TextBlock('score-text', 'Score: 00.000.000');
        scoreText.color = '#1bf9fb';
        scoreText.fontSize = 28;
        if (typeof window !== 'undefined') {
          scoreText.fontFamily = window.getComputedStyle(document.body).fontFamily;
        }
        scoreContainer.addControl(scoreText);
        const heartSizePx = 44;
        const heartGapPx = 10;
        const livesContainer = new GUI.Rectangle('lives-container');
        livesContainer.width = `${heartSizePx * maxLives + heartGapPx * (maxLives - 1)}px`;
        livesContainer.height = `${heartSizePx}px`;
        livesContainer.thickness = 0;
        livesContainer.top = '24px';
        livesContainer.left = '-24px';
        livesContainer.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        livesContainer.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_TOP;
        scoreUi.addControl(livesContainer);
        const fullHeartImage = '/resources/img/heart.webp';
        const emptyHeartImage = '/resources/img/heart2.webp';
        const heartIcons: GUI.Image[] = [];
        for (let i = 0; i < maxLives; i++) {
          const heartIcon = new GUI.Image(`life-heart-${i}`, fullHeartImage);
          heartIcon.width = `${heartSizePx}px`;
          heartIcon.height = `${heartSizePx}px`;
          heartIcon.horizontalAlignment = GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
          heartIcon.verticalAlignment = GUI.Control.VERTICAL_ALIGNMENT_CENTER;
          heartIcon.left = `${i * (heartSizePx + heartGapPx)}px`;
          heartIcon.stretch = GUI.Image.STRETCH_UNIFORM;
          livesContainer.addControl(heartIcon);
          heartIcons.push(heartIcon);
        }
        const formatScore = (value: number): string => {
          const clampedValue = BABYLON.Scalar.Clamp(value, 0, maxScore);
          const padded = Math.floor(clampedValue).toString().padStart(8, '0');
          return `${padded.slice(0, 2)}.${padded.slice(2, 5)}.${padded.slice(5, 8)}`;
        };
        const updateScoreText = () => {
          scoreText.text = `Score: ${formatScore(score)}`;
        };
        const updateLivesUi = () => {
          for (let i = 0; i < heartIcons.length; i++) {
            heartIcons[i].source = i < livesLeft ? fullHeartImage : emptyHeartImage;
          }
        };
        updateScoreText();
        updateLivesUi();
        const getBumperPointsFromName = (name: string): number => {
          const pointsMatch = name.match(/(\d+)/);
          if (!pointsMatch) {
            return 0;
          }
          return Number.parseInt(pointsMatch[1], 10) || 0;
        };
        let lastScoredBumperName: string | null = null;


        // Meshes (Cada parte del pinball)
        const tableWalls = scene.getMeshByName("pinball-body-base") as BABYLON.Mesh | null;
        const tableGround = scene.getMeshByName("pinball-body-int") as BABYLON.Mesh | null;
        const ballTemplate =
          (scene.getMeshByName("__root__pinball-body-ball") as BABYLON.Mesh | null) ??
          (scene.getMeshByName("pinball-body-ball") as BABYLON.Mesh | null);
        if (ballTemplate) {
          const ballScaleFactor = 0.72;
          ballTemplate.scaling = new BABYLON.Vector3(ballScaleFactor, ballScaleFactor, ballScaleFactor);
          ballTemplate.isVisible = false;
          ballTemplate.isPickable = false;
          ballTemplate.setEnabled(false);
        }
        let activeBall: BABYLON.Mesh | null = null;
        let activeBallBody: BABYLON.PhysicsBody | null = null;

        const flipperLeft = scene.getMeshByName("pinball-body-flipper-L") as BABYLON.Mesh;
        const leftPivot = scene.getTransformNodeByName("Empty-flipper-L") as BABYLON.TransformNode;
        const flipperRight = scene.getMeshByName("pinball-body-flipper-R") as BABYLON.Mesh;
        const rightPivot = scene.getTransformNodeByName("Empty-flipper-R") as BABYLON.TransformNode;

        const plunger = scene.getMeshByName("pinball-body-plunger") as BABYLON.Mesh | null;

        const bumper750L = scene.getMeshByName("pinball-body-bumper750-L");
        const bumper750LMidl = scene.getMeshByName("pinball-body-bumper750-L-Midl");
        const bumper750R = scene.getMeshByName("pinball-body-bumper750-R");
        const bumper750RMidl = scene.getMeshByName("pinball-body-bumper750-R-Midl");
        const bumper2000L = scene.getMeshByName("pinball-body-bumper2000-L");
        const bumper2000R = scene.getMeshByName("pinball-body-bumper2000-R");
        const bumper3500L = scene.getMeshByName("pinball-body-bumper3500-L");
        const bumper3500R = scene.getMeshByName("pinball-body-bumper3500-R");
        const bumper5000L = scene.getMeshByName("pinball-body-bumper5000-L");
        const bumper5000R = scene.getMeshByName("pinball-body-bumper5000-R");
        const bumper5000Midl = scene.getMeshByName("pinball-body-bumper5000-Midl");
        const bumper6300L = scene.getMeshByName("pinball-body-bumper6300-L");
        const bumper6300R = scene.getMeshByName("pinball-body-bumper6300-R");
        const bumper6300Midl = scene.getMeshByName("pinball-body-bumper6300-Midl");

        const bottomOutMesh = scene.getMeshByName("pinball-body-deadzone") as BABYLON.Mesh | null;
        if (bottomOutMesh) {
          bottomOutMesh.isVisible = false;
          bottomOutMesh.visibility = 0;
          bottomOutMesh.isPickable = false;
        }
        let bottomOutBody: BABYLON.PhysicsBody | null = null;

        // Mesa
        if(tableWalls && tableGround) {
          new BABYLON.PhysicsAggregate(
            tableWalls,
            BABYLON.PhysicsShapeType.MESH,
            { mass: 0, friction: 0.7, restitution: 0.1 },
            scene,
          );
          new BABYLON.PhysicsAggregate(
            tableGround,
            BABYLON.PhysicsShapeType.MESH,
            { mass: 0, friction: 0.7, restitution: 0.1 },
            scene,
          );
          if (bottomOutMesh) {
            const bottomOutAggregate = new BABYLON.PhysicsAggregate(
              bottomOutMesh,
              BABYLON.PhysicsShapeType.MESH,
              { mass: 0, friction: 0.7, restitution: 0.1 },
              scene,
            );
            bottomOutBody = bottomOutAggregate.body;
          }

          // Techo invisible.
          const ballDiameter = ballTemplate?.getBoundingInfo().boundingSphere.radiusWorld
            ? ballTemplate.getBoundingInfo().boundingSphere.radiusWorld * 2
            : 0.35;
          const verticalGap = ballDiameter * 0.95;
          const tableGroundCover = tableGround.clone('table-ground-cover');
          if (tableGroundCover) {
            tableGroundCover.parent = tableGround.parent;
            tableGroundCover.position.copyFrom(tableGround.position);
            tableGroundCover.rotation.copyFrom(tableGround.rotation);
            tableGroundCover.scaling.copyFrom(tableGround.scaling);
            tableGroundCover.rotationQuaternion = tableGround.rotationQuaternion?.clone() ?? null;
            tableGroundCover.position.y += verticalGap;

            const coverMaterial = new BABYLON.StandardMaterial('table-ground-cover-mat', scene);
            coverMaterial.alpha = 0;
            coverMaterial.disableLighting = true;
            coverMaterial.backFaceCulling = false;
            tableGroundCover.material = coverMaterial;
            tableGroundCover.isPickable = false;

            new BABYLON.PhysicsAggregate(
              tableGroundCover,
              BABYLON.PhysicsShapeType.MESH,
              { mass: 0, friction: 0.7, restitution: 0.1 },
              scene,
            );
          }
        }

        //plunger
        if (plunger) {
          const plungerAggregate = new BABYLON.PhysicsAggregate(
            plunger,
            BABYLON.PhysicsShapeType.BOX,
            { mass: 0, friction: 0.95, restitution: 0.05 },
            scene,
          );
          const plungerBody = plungerAggregate.body;

          plungerBody.setMotionType(BABYLON.PhysicsMotionType.ANIMATED);

          const plungerInitialPosition = plunger.getAbsolutePosition().clone();
          const plungerRotation = plunger.absoluteRotationQuaternion?.clone() ?? BABYLON.Quaternion.FromEulerVector(plunger.rotation);

          // Direccion de retroceso
          const plungerPullAxis = plunger.getDirection(BABYLON.Axis.Z).normalize();
          const maxPullDistance = 0.30;
          const pullSpeed = 0.55;
          const releaseSpeed = 2.4;
          let isChargingPlunger = false;
          let currentPullDistance = 0;
          let pendingLaunchStrength = 0;
           
          //Controles Plunger
          scene.onKeyboardObservable.add((keyboardInfo) => {
            if (keyboardInfo.event.code !== 'Space') {
              return;
            }

            if (keyboardInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
              keyboardInfo.event.preventDefault();
              isChargingPlunger = true;
            } else if (keyboardInfo.type === BABYLON.KeyboardEventTypes.KEYUP) {
              keyboardInfo.event.preventDefault();
              isChargingPlunger = false;
              pendingLaunchStrength = BABYLON.Scalar.Lerp(
                4,
                18,
                currentPullDistance / maxPullDistance,
              );
            }
          });

          scene.onBeforeRenderObservable.add(() => {
            const dt = scene.getEngine().getDeltaTime() / 1000;
            const step = isChargingPlunger ? pullSpeed * dt : -releaseSpeed * dt;
            currentPullDistance = BABYLON.Scalar.Clamp(currentPullDistance + step, 0, maxPullDistance);

            const targetPosition = plungerInitialPosition.add(plungerPullAxis.scale(currentPullDistance));

            // Mueve visual y cuerpo de físicas hacia el mismo objetivo.
            plunger.setAbsolutePosition(targetPosition);
            plungerBody.setTargetTransform(targetPosition, plungerRotation);

            // El impulso solo se aplica si hay contacto real plunger <-> bola durante el avance.
            if (!isChargingPlunger && pendingLaunchStrength > 0 && activeBall && activeBallBody) {
              const touchingBall = plunger.getBoundingInfo().boundingBox;
              const ballBox = activeBall.getBoundingInfo().boundingBox;
              const isTouchingBall = BABYLON.BoundingBox.Intersects(touchingBall, ballBox);

              if (isTouchingBall) {
                const launchDirection = plungerPullAxis.scale(-1);
                const impulse = launchDirection.scale(pendingLaunchStrength);
                activeBallBody.applyImpulse(impulse, activeBall.getAbsolutePosition());
                pendingLaunchStrength = 0;
                sfx.playPlunger();

              } else if (currentPullDistance <= 0.001) {
                pendingLaunchStrength = 0;
              }
            }
          });
        }

        // Flippers
        if (flipperLeft && flipperRight && leftPivot && rightPivot) {
          const flipperLeftAggregate = new BABYLON.PhysicsAggregate(
            flipperLeft,
            BABYLON.PhysicsShapeType.MESH,
            { mass: 0, friction: 0.95, restitution: 0.05 },
            scene,
          );
          const flipperLeftBody = flipperLeftAggregate.body;

          flipperLeftBody.setMotionType(BABYLON.PhysicsMotionType.ANIMATED);
          flipperLeft.computeWorldMatrix(true);
          leftPivot.computeWorldMatrix(true);

          const pivotWorldPosition = leftPivot.getAbsolutePosition().clone();
          const pivotWorldRotation = leftPivot.absoluteRotationQuaternion?.clone() ?? BABYLON.Quaternion.FromEulerVector(leftPivot.rotation);
          const flipperLeftInitialPosition = flipperLeft.getAbsolutePosition().clone();
          const flipperLeftInitialRotation = flipperLeft.absoluteRotationQuaternion?.clone() ?? BABYLON.Quaternion.FromEulerVector(flipperLeft.rotation);
          const pivotWorldRotationInverse = pivotWorldRotation.clone().invert();
          const initialOffsetFromPivot = flipperLeftInitialPosition.subtract(pivotWorldPosition);
          const pivotInverseMatrix = BABYLON.Matrix.Identity();

          pivotWorldRotationInverse.toRotationMatrix(pivotInverseMatrix);

          const localOffsetFromPivot = BABYLON.Vector3.TransformCoordinates(initialOffsetFromPivot,pivotInverseMatrix);
          const initialLocalRotation = pivotWorldRotationInverse.multiply(flipperLeftInitialRotation).normalize();
          const horizontalAxis = BABYLON.Axis.Y;
          const leftMaxAngle = BABYLON.Tools.ToRadians(45);
          const leftPressSpeed = BABYLON.Tools.ToRadians(720);
          const leftReleaseSpeed = BABYLON.Tools.ToRadians(540);

          let leftCurrentAngle = 0;
          let isLeftFlipperPressed = false;

          scene.onKeyboardObservable.add((keyboardInfo) => {
            if (keyboardInfo.event.code !== 'KeyF') {
              return;
            }
            if (keyboardInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
              keyboardInfo.event.preventDefault();
              if (isLeftFlipperPressed) {
                return;
              }
              isLeftFlipperPressed = true;
              sfx.playFlipper();
            } else if (keyboardInfo.type === BABYLON.KeyboardEventTypes.KEYUP) {
              keyboardInfo.event.preventDefault();
              isLeftFlipperPressed = false;
            }
          });

          scene.onBeforeRenderObservable.add(() => {
            const dt = scene.getEngine().getDeltaTime() / 1000;
            const targetAngle = isLeftFlipperPressed ? leftMaxAngle : 0;
            const maxStep = (isLeftFlipperPressed ? leftPressSpeed : leftReleaseSpeed) * dt;
            const angleDelta = targetAngle - leftCurrentAngle;
            if (Math.abs(angleDelta) <= maxStep) {
              leftCurrentAngle = targetAngle;
            } else {
              leftCurrentAngle += Math.sign(angleDelta) * maxStep;
            }

            const swingRotation = BABYLON.Quaternion.RotationAxis(horizontalAxis,leftCurrentAngle,);
            const pivotWithSwingRotation = pivotWorldRotation.multiply(swingRotation).normalize();
            const targetRotation = pivotWithSwingRotation.multiply(initialLocalRotation).normalize();
            const pivotWithSwingMatrix = BABYLON.Matrix.Identity();

            pivotWithSwingRotation.toRotationMatrix(pivotWithSwingMatrix);

            const rotatedOffset = BABYLON.Vector3.TransformCoordinates(localOffsetFromPivot,pivotWithSwingMatrix);
            const targetPosition = pivotWorldPosition.add(rotatedOffset);

            flipperLeftBody.setTargetTransform(targetPosition, targetRotation);
          });

          const flipperRightAggregate = new BABYLON.PhysicsAggregate(
            flipperRight,
            BABYLON.PhysicsShapeType.MESH,
            { mass: 0, friction: 0.95, restitution: 0.05 },
            scene,
          );
          const flipperRightBody = flipperRightAggregate.body;

          flipperRightBody.setMotionType(BABYLON.PhysicsMotionType.ANIMATED);

          flipperRight.computeWorldMatrix(true);
          rightPivot.computeWorldMatrix(true);

          const rightPivotWorldPosition = rightPivot.getAbsolutePosition().clone();
          const rightPivotWorldRotation = rightPivot.absoluteRotationQuaternion?.clone() ?? BABYLON.Quaternion.FromEulerVector(rightPivot.rotation);

          const flipperRightInitialPosition = flipperRight.getAbsolutePosition().clone();
          const flipperRightInitialRotation = flipperRight.absoluteRotationQuaternion?.clone() ?? BABYLON.Quaternion.FromEulerVector(flipperRight.rotation);
          const rightPivotWorldRotationInverse = rightPivotWorldRotation.clone().invert();
          const rightInitialOffsetFromPivot = flipperRightInitialPosition.subtract(rightPivotWorldPosition);
          const rightPivotInverseMatrix = BABYLON.Matrix.Identity();

          rightPivotWorldRotationInverse.toRotationMatrix(rightPivotInverseMatrix);

          const rightLocalOffsetFromPivot = BABYLON.Vector3.TransformCoordinates(rightInitialOffsetFromPivot,rightPivotInverseMatrix,);
          const rightInitialLocalRotation = rightPivotWorldRotationInverse.multiply(flipperRightInitialRotation).normalize();

          const rightMaxAngle = -BABYLON.Tools.ToRadians(45);
          const rightPressSpeed = BABYLON.Tools.ToRadians(720);
          const rightReleaseSpeed = BABYLON.Tools.ToRadians(540);

          let rightCurrentAngle = 0;
          let isRightFlipperPressed = false;

          scene.onKeyboardObservable.add((keyboardInfo) => {
            if (keyboardInfo.event.code !== 'KeyJ') {
              return;
            }
            if (keyboardInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
              keyboardInfo.event.preventDefault();
              if (isRightFlipperPressed) {
                return;
              }
              isRightFlipperPressed = true;
              sfx.playFlipper();
            } else if (keyboardInfo.type === BABYLON.KeyboardEventTypes.KEYUP) {
              keyboardInfo.event.preventDefault();
              isRightFlipperPressed = false;
            }
          });

          scene.onBeforeRenderObservable.add(() => {
            const dt = scene.getEngine().getDeltaTime() / 1000;
            const rightTargetAngle = isRightFlipperPressed ? rightMaxAngle : 0;
            const rightMaxStep = (isRightFlipperPressed ? rightPressSpeed : rightReleaseSpeed) * dt;
            const rightAngleDelta = rightTargetAngle - rightCurrentAngle;
            if (Math.abs(rightAngleDelta) <= rightMaxStep) {
              rightCurrentAngle = rightTargetAngle;
            } else {
              rightCurrentAngle += Math.sign(rightAngleDelta) * rightMaxStep;
            }

            const rightSwingRotation = BABYLON.Quaternion.RotationAxis(horizontalAxis, rightCurrentAngle);
            const rightPivotWithSwingRotation = rightPivotWorldRotation.multiply(rightSwingRotation).normalize();
            const rightTargetRotation = rightPivotWithSwingRotation.multiply(rightInitialLocalRotation).normalize();
            const rightPivotWithSwingMatrix = BABYLON.Matrix.Identity();

            rightPivotWithSwingRotation.toRotationMatrix(rightPivotWithSwingMatrix);

            const rightRotatedOffset = BABYLON.Vector3.TransformCoordinates(rightLocalOffsetFromPivot, rightPivotWithSwingMatrix);
            const rightTargetPosition = rightPivotWorldPosition.add(rightRotatedOffset);

            flipperRightBody.setTargetTransform(rightTargetPosition, rightTargetRotation);
          });
        }

        
        // Bumpers
        const bumpers = [
          bumper750L,
          bumper750LMidl,
          bumper750R,
          bumper750RMidl,                   
          bumper2000L,
          bumper2000R,
          bumper3500L,
          bumper3500R,
          bumper5000L,
          bumper5000R,
          bumper5000Midl,
          bumper6300L,
          bumper6300R,
          bumper6300Midl,
        ].filter((mesh): mesh is BABYLON.AbstractMesh => mesh instanceof BABYLON.AbstractMesh);
        const bumperBodyToName = new Map<BABYLON.PhysicsBody, string>();
        const onBumperHitByName = (bumperName: string) => {
          if (lastScoredBumperName === bumperName) {
            return;
          }
          const bumperPoints = getBumperPointsFromName(bumperName);
          if (bumperPoints <= 0) {
            return;
          }
          score = BABYLON.Scalar.Clamp(score + bumperPoints, 0, maxScore);
          lastScoredBumperName = bumperName;
          updateScoreText();
          sfx.playBumper();
          console.log(`[TRIGGER] Bumper hit: ${bumperName} (+${bumperPoints}) => ${score}`);
        };

        for (const bumper of bumpers) {
          const bumperAggregate = new BABYLON.PhysicsAggregate(
            bumper,
            BABYLON.PhysicsShapeType.MESH,
            { mass: 0, friction: 0.2, restitution: 1.5 },
            scene,
          );
          bumperBodyToName.set(bumperAggregate.body, bumper.name);
        }
        

        // Bola  
        if (ballTemplate) {
          const safeSpawnPosition = ballTemplate.getAbsolutePosition().clone();
          safeSpawnPosition.y += 1.4;
          safeSpawnPosition.x += 0.4;
          const spawnPointDown = safeSpawnPosition.clone();
          let shouldRespawnBall = false;
          const pendingBumperHits = new Set<string>();
          const bumperHitCooldownFramesByName = new Map<string, number>();
          const touchingBumpers = new Set<string>();
          const applySelectedBallTexture = (mesh: BABYLON.Mesh): void => {
            const slug = this.selectedBall.activeTextureSlug();
            void getBallPbrMaterial(slug, scene).then((material) => {
              applyBallMaterialToMesh(mesh, material);
            });
          };

          const createNewBall = () => {
            if (activeBall) {
              activeBall.dispose();
              activeBall = null;
              activeBallBody = null;
            }

            const spawnedBall = ballTemplate.clone(`ball-active-${Date.now()}`) as BABYLON.Mesh | null;
            if (!spawnedBall) {
              return;
            }
            spawnedBall.setEnabled(true);
            spawnedBall.isVisible = true;
            spawnedBall.isPickable = true;
            spawnedBall.setAbsolutePosition(spawnPointDown);
            applySelectedBallTexture(spawnedBall);

            new BABYLON.PhysicsAggregate(
              spawnedBall,
              BABYLON.PhysicsShapeType.SPHERE,
              { mass: 1.5, restitution: 0.65, friction: 0 },
              scene,
            );

            const spawnedBallBody = spawnedBall.physicsBody;
            if (!spawnedBallBody) {
              spawnedBall.dispose();
              return;
            }
            spawnedBallBody.setLinearDamping(0.05);
            spawnedBallBody.setAngularDamping(0.05);
            spawnedBallBody.getCollisionObservable().add((collisionEvent) => {
              if (bottomOutBody && collisionEvent.collidedAgainst === bottomOutBody) {
                shouldRespawnBall = true;
                return;
              }
              const collidedBumperName = bumperBodyToName.get(collisionEvent.collidedAgainst);
              if (collidedBumperName) {
                pendingBumperHits.add(collidedBumperName);
              }
            });

            activeBall = spawnedBall;
            activeBallBody = spawnedBallBody;
            pendingBumperHits.clear();
            bumperHitCooldownFramesByName.clear();
            touchingBumpers.clear();
            lastScoredBumperName = null;
          };
          createNewBall();

          const maxBallSpeed = 8;
          const maxBallSpeedSquared = maxBallSpeed * maxBallSpeed;
          const currentBallVelocity = BABYLON.Vector3.Zero();
          const zeroVelocity = BABYLON.Vector3.Zero();
          const ballCenter = BABYLON.Vector3.Zero();
          const bumperCenter = BABYLON.Vector3.Zero();
          let bottomOutCooldownFrames = 0;
          let tableBaseMinY: number | null = null;
          if (tableGround) {
            tableGround.computeWorldMatrix(true);
            tableBaseMinY = tableGround.getBoundingInfo().boundingBox.minimumWorld.y;
          }

          const isBallBelowMachineBase = (): boolean => {
            if (tableBaseMinY === null || !activeBall) {
              return false;
            }
            activeBall.computeWorldMatrix(true);
            const ballY = activeBall.getBoundingInfo().boundingSphere.centerWorld.y;
            const ballRadius = activeBall.getBoundingInfo().boundingSphere.radiusWorld;
            return ballY + ballRadius < tableBaseMinY - 0.05;
          };

          const respawnBallWithoutLifeLoss = () => {
            if (gameOverHandled || livesLeft <= 0) {
              return;
            }
            shouldRespawnBall = false;
            createNewBall();
            if (activeBallBody) {
              activeBallBody.setLinearVelocity(zeroVelocity);
              activeBallBody.setAngularVelocity(zeroVelocity);
            }
          };

          const loseLifeAndRespawn = () => {
            if (livesLeft <= 0 || gameOverHandled) {
              return;
            }
            livesLeft = Math.max(0, livesLeft - 1);
            updateLivesUi();
            if (livesLeft <= 0) {
              sfx.playConfetti();
              gameOverHandled = true;
              const durationSeconds = Math.max(1, Math.floor((Date.now() - runStartedAtMs) / 1000));
              void this.onGameOver(score, durationSeconds);
              if (activeBall) {
                activeBall.dispose();
                activeBall = null;
                activeBallBody = null;
              }
              return;
            }
            sfx.playLoseLife();
            createNewBall();
            if (activeBallBody) {
              activeBallBody.setLinearVelocity(zeroVelocity);
              activeBallBody.setAngularVelocity(zeroVelocity);
            }
          };

          scene.onBeforeRenderObservable.add(() => {
            if (!activeBall || !activeBallBody) {
              return;
            }

            for (const [bumperName, cooldownFrames] of bumperHitCooldownFramesByName.entries()) {
              if (cooldownFrames <= 1) {
                bumperHitCooldownFramesByName.delete(bumperName);
              } else {
                bumperHitCooldownFramesByName.set(bumperName, cooldownFrames - 1);
              }
            }
            for (const bumperName of pendingBumperHits) {
              if ((bumperHitCooldownFramesByName.get(bumperName) ?? 0) > 0) {
                continue;
              }
              onBumperHitByName(bumperName);
              bumperHitCooldownFramesByName.set(bumperName, 4);
            }
            pendingBumperHits.clear();

            // Fallback puntuacion
            const ballSphere = activeBall.getBoundingInfo().boundingSphere;

            ballCenter.copyFrom(ballSphere.centerWorld);
            const ballRadius = ballSphere.radiusWorld;

            for (const bumper of bumpers) {
              const bumperName = bumper.name;
              const bumperSphere = bumper.getBoundingInfo().boundingSphere;
              bumperCenter.copyFrom(bumperSphere.centerWorld);
              const triggerDistance = ballRadius + bumperSphere.radiusWorld * 0.45;
              const isStrictlyTouching = activeBall.intersectsMesh(bumper, true) && BABYLON.Vector3.DistanceSquared(ballCenter, bumperCenter) <= triggerDistance * triggerDistance;
              const wasTouching = touchingBumpers.has(bumperName);
              if (isStrictlyTouching && !wasTouching) {
                touchingBumpers.add(bumperName);
                if ((bumperHitCooldownFramesByName.get(bumperName) ?? 0) <= 0) {
                  onBumperHitByName(bumperName);
                  bumperHitCooldownFramesByName.set(bumperName, 4);
                }
              } else if (!isStrictlyTouching && wasTouching) {
                touchingBumpers.delete(bumperName);
              }
            }

            if (bottomOutCooldownFrames > 0) {
              bottomOutCooldownFrames--;
            } else if (isBallBelowMachineBase()) {
              respawnBallWithoutLifeLoss();
              bottomOutCooldownFrames = 25;
              return;
            } else if (shouldRespawnBall || (bottomOutMesh && activeBall.intersectsMesh(bottomOutMesh, true))) {
              shouldRespawnBall = false;
              loseLifeAndRespawn();
              bottomOutCooldownFrames = 20;
              return;
            }

            activeBallBody.getLinearVelocityToRef(currentBallVelocity);
            if (currentBallVelocity.lengthSquared() <= maxBallSpeedSquared) {
              return;
            }

            currentBallVelocity.normalize().scaleInPlace(maxBallSpeed);
            activeBallBody.setLinearVelocity(currentBallVelocity);
          });
        }

        engine.hideLoadingUI();
      })
      .catch((error) => {
        engine.hideLoadingUI();
        console.error('Error initializing Havok or loading pinball mesh:', error);
      });
          
      return scene;
  };


  /**
   * Funcion para llamarla al acabar la partida para que hace uso del servicio de bloqueo de partida diaria
   */
  finishDailyRun(): void {
    this.dailyLock.markDailyCompleted();
    void this.router.navigate(['/leaderboard']);
  }
}
