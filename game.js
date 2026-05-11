const LEVELS = [
    {
        ball: { x: 800, y: 236 },
        shots: 4,
        black: [
            { x: 660, y: 500, w: 32, h: 180 },
            { x: 940, y: 500, w: 32, h: 180 }
        ],
        gray: [
            { x: 750, y: 356, w: 32, h: 150 },
            { x: 850, y: 356, w: 32, h: 150 },
            { x: 800, y: 270, w: 150, h: 24 }
        ]
    },
    {
        ball: { x: 805, y: 168 },
        shots: 5,
        black: [
            { x: 965, y: 520, w: 32, h: 150 },
            { x: 650, y: 300, w: 32, h: 100 }
        ],
        gray: [
            { x: 735, y: 435, w: 30, h: 180 },
            { x: 875, y: 435, w: 30, h: 180 },
            { x: 805, y: 335, w: 180, h: 24 },
            { x: 760, y: 265, w: 30, h: 110 },
            { x: 850, y: 265, w: 30, h: 110 },
            { x: 805, y: 202, w: 150, h: 24 }
        ]
    },
    {
        ball: { x: 825, y: 150 },
        shots: 5,
        black: [
            { x: 625, y: 510, w: 32, h: 670 },
        ],
        gray: [
            { x: 720, y: 400, w: 30, h: 180 },
            { x: 930, y: 400, w: 30, h: 180 },
            { x: 825, y: 295, w: 260, h: 24 },
            { x: 790, y: 230, w: 30, h: 110 },
            { x: 860, y: 230, w: 30, h: 110 },
            { x: 825, y: 175, w: 150, h: 24 }
        ]
    }
];

class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
    }

    create() {
        background(this, false);

        this.add.text(84, 90, 'Slingshotter', {
            fontFamily: 'Arial',
            fontSize: '52px',
            color: '#111111',
            fontStyle: 'bold'
        });

        this.add.text(88, 160, 'Knock the green ball to the ground.', {
            fontSize: '24px',
            color: '#222222'
        });

        createButton(this, 88, 220, 160, 50, 'Start', () => {
            this.scene.start('GameScene', { levelIndex: 0 });
        });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init(data) {
        this.levelIndex = data.levelIndex || 0;
        this.level = LEVELS[this.levelIndex];
        this.shotsLeft = this.level.shots;
        this.isAiming = false;
        this.won = false;
        this.nextScene = null;
        this.elapsedMs = 0;
        this.ballReleased = false;
        this.ballStartX = 0;
    }

    create() {
        this.matter.world.setGravity(0, 1);

        background(this, false);
        this.addWorldBounds();
        this.addHud();
        this.addBlocks();
        this.addBall();
        this.addSling();
        this.bindInput();
        this.spawnShot();
        this.startedAt = this.time.now;

        this.matter.world.on('collisionstart', this.handleCollision, this);
    }

    addWorldBounds() {
        this.ground = addBlackBlock(this, 600, 632, 1240, 90);
        this.ground.role = 'ground';
        addBlackBlock(this, -25, 338, 50, 675);
        addBlackBlock(this, 1225, 338, 50, 675);
    }

    addHud() {
        this.add.text(24, 20, `Level ${this.levelIndex + 1}/${LEVELS.length}`, {
            fontSize: '22px',
            color: '#111111',
            fontStyle: 'bold'
        });

        this.shotText = this.add.text(24, 52, '', {
            fontSize: '20px',
            color: '#222222'
        });


        createButton(this, 1042, 22, 92, 40, 'Reset', () => this.resetLevel());

        this.updateShotText();
    }

    addBlocks() {
        this.level.black.forEach((block) => {
            addBlackBlock(this, block.x, block.y, block.w, block.h);
        });

        this.level.gray.forEach((block) => {
            addGrayBrick(this, block.x, block.y, block.w, block.h);
        });
    }

    addBall() {
        this.ball = this.add.circle(this.level.ball.x, this.level.ball.y, 22, 0x28b463)
            .setStrokeStyle(3, 0x0b5d2a);
        this.matter.add.gameObject(this.ball, {
            shape: { type: 'circle', radius: 22 },
            friction: 0.5,
        });
        this.ball.body.role = 'ball';
        this.ballStartX = this.level.ball.x;
    }

    addSling() {
        this.anchor = new Phaser.Math.Vector2(190, 424);
        this.leftFork = new Phaser.Math.Vector2(145, 409);
        this.rightFork = new Phaser.Math.Vector2(235, 409);
        this.maxPull = 130;
        this.power = 0.19;

        this.add.line(0, 0, 190, 587, 190, 484, 0x111111, 1)
            .setOrigin(0, 0)
            .setLineWidth(9);
        this.add.line(0, 0, 190, 484, this.leftFork.x, this.leftFork.y, 0x111111, 1)
            .setOrigin(0, 0)
            .setLineWidth(9);
        this.add.line(0, 0, 190, 484, this.rightFork.x, this.rightFork.y, 0x111111, 1)
            .setOrigin(0, 0)
            .setLineWidth(9);

        this.aimLine = this.add.graphics();
    }

    bindInput() {
        this.input.on('pointerdown', (pointer) => {
            if (!this.shot || this.won) {
                return;
            }

            const nearShot = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.shot.x, this.shot.y) < 90;

            if (nearShot) {
                this.isAiming = true;
                this.updateAim(pointer);
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (this.isAiming) {
                this.updateAim(pointer);
            }
        });

        this.input.on('pointerup', () => {
            if (this.isAiming) {
                this.launchShot();
            }
        });

        this.input.keyboard.on('keydown-R', () => this.resetLevel());
    }

    spawnShot() {
        if (this.shotsLeft <= 0 || this.won) {
            this.shot = null;
            return;
        }

        this.shot = this.add.circle(this.anchor.x, this.anchor.y, 20, 0xd22b2b)
            .setStrokeStyle(3, 0x8f1616);
        this.matter.add.gameObject(this.shot, {
            shape: { type: 'circle', radius: 20 },
            friction: 0.5,
            frictionAir: 0.006,
            restitution: 0.35,
            density: 0.006
        });
        this.shot.setStatic(true);
    }

    updateAim(pointer) {
        const dx = pointer.x - this.anchor.x;
        const dy = pointer.y - this.anchor.y;
        const distance = Math.min(this.maxPull, Math.sqrt(dx * dx + dy * dy));
        const angle = Math.atan2(dy, dx);

        this.shot.setPosition(
            this.anchor.x + Math.cos(angle) * distance,
            this.anchor.y + Math.sin(angle) * distance
        );

        this.aimLine.clear();
        this.aimLine.lineStyle(5, 0x111111, 1);
        this.aimLine.lineBetween(this.leftFork.x, this.leftFork.y, this.shot.x, this.shot.y);
        this.aimLine.lineBetween(this.rightFork.x, this.rightFork.y, this.shot.x, this.shot.y);
    }

    launchShot() {
        if (!this.shot || this.won) {
            return;
        }

        const pull = Phaser.Math.Distance.Between(this.anchor.x, this.anchor.y, this.shot.x, this.shot.y);

        if (pull < 10) {
            return;
        }

        const shot = this.shot;
        const vx = (this.anchor.x - shot.x) * this.power;
        const vy = (this.anchor.y - shot.y) * this.power;

        this.releaseBall();
        shot.setStatic(false);
        shot.setVelocity(vx, vy);
        shot.setAngularVelocity(vx * 0.01);

        this.shot = null;
        this.isAiming = false;
        this.aimLine.clear();
        this.shotsLeft -= 1;
        this.updateShotText();

        this.time.delayedCall(850, () => this.spawnShot());
    }

    handleCollision(event) {
        if (this.won) {
            return;
        }

        event.pairs.forEach((pair) => {
            const a = pair.bodyA;
            const b = pair.bodyB;
            const ballTouchedGround = (a.role === 'ball' && b.role === 'ground') || (a.role === 'ground' && b.role === 'ball');

            if (ballTouchedGround) {
                this.winLevel();
            }
        });
    }

    winLevel() {
        this.won = true;
        this.elapsedMs = this.time.now - this.startedAt;
        this.aimLine.clear();

        this.time.delayedCall(700, () => {
            this.queueScoreScene({
                levelIndex: this.levelIndex,
                shotsLeft: this.shotsLeft,
                elapsedMs: this.elapsedMs
            });
        });
    }

    resetLevel() {
        this.isAiming = false;
        this.won = false;
        this.changeLevel(this.levelIndex);
    }

    changeLevel(levelIndex) {
        this.queueSceneChange('GameScene', { levelIndex });
    }

    releaseBall() {
        if (!this.ballReleased) {
            this.ballReleased = true;
        }
    }

    lockBallHorizontally() {
        if (this.ballReleased || this.won || !this.ball || !this.ball.body) {
            return;
        }

        const velocityY = this.ball.body.velocity.y;

        this.ball.setPosition(this.ballStartX, this.ball.y);
        this.ball.setVelocity(0, velocityY);
        this.ball.setAngularVelocity(0);
    }

    queueScoreScene(data) {
        if (!this.nextScene) {
            this.nextScene = {
                sceneKey: 'LevelCompleteScene',
                data,
                pauseGame: true
            };
        }
    }

    queueSceneChange(sceneKey, data) {
        if (!this.nextScene) {
            this.nextScene = { sceneKey, data, pauseGame: false };
        }
    }

    updateShotText() {
        this.shotText.setText(`Shots: ${this.shotsLeft}`);
    }

    update() {
        this.lockBallHorizontally();

        if (this.nextScene) {
            const nextScene = this.nextScene;

            this.nextScene = null;
            if (this.matter && this.matter.world && this.matter.world.off) {
                this.matter.world.off('collisionstart', this.handleCollision, this);
            }

            if (nextScene.pauseGame) {
                this.scene.launch(nextScene.sceneKey, nextScene.data);
                this.scene.pause();
            } else {
                this.scene.start(nextScene.sceneKey, nextScene.data);
            }
        }
    }
}

class CompleteScene extends Phaser.Scene {
    constructor() {
        super('CompleteScene');
    }

    create() {
        background(this, false);

        this.add.text(84, 100, 'Complete', {
            fontFamily: 'Arial',
            fontSize: '52px',
            color: '#111111',
            fontStyle: 'bold'
        });

        createButton(this, 88, 180, 190, 50, 'Play Again', () => {
            this.scene.start('GameScene', { levelIndex: 0 });
        });
    }
}

class LevelCompleteScene extends Phaser.Scene {
    constructor() {
        super('LevelCompleteScene');
    }

    init(data) {
        this.levelIndex = data.levelIndex || 0;
        this.shotsLeft = data.shotsLeft || 0;
        this.elapsedMs = data.elapsedMs || 0;
    }

    create() {
        const stars = Math.min(3, Math.max(0, this.shotsLeft));
        const score = scoreForTime(this.elapsedMs, stars);
        const nextLabel = this.levelIndex + 1 < LEVELS.length ? 'Continue' : 'Finish';

        background(this, false);

        for (let i = 0; i < 3; i += 1) {
            drawStar(this, 470 + i * 130, 118, 58, i < stars);
        }

        this.add.text(600, 265, 'Level Complete', {
            fontFamily: 'Arial',
            fontSize: '36px',
            color: '#555555'
        }).setOrigin(0.5);

        this.add.text(600, 350, `Score: ${score}`, {
            fontFamily: 'Arial',
            fontSize: '36px',
            color: '#555555'
        }).setOrigin(0.5);

        createScoreButton(this, 465, 422, 270, 62, nextLabel, () => {
            this.scene.stop('GameScene');

            if (this.levelIndex + 1 < LEVELS.length) {
                this.scene.start('GameScene', { levelIndex: this.levelIndex + 1 });
            } else {
                this.scene.start('CompleteScene');
            }
        });
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#ffffff',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1 },
            debug: false
        }
    },
    scene: [TitleScene, GameScene, LevelCompleteScene, CompleteScene]
};

new Phaser.Game(config);
