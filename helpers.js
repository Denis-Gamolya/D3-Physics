const GAME_WIDTH = 1200;
const GAME_HEIGHT = 675;

function background(scene, showGround = true) {
    scene.cameras.main.setBackgroundColor(0xffffff);
    scene.add.rectangle(600, 337, GAME_WIDTH, GAME_HEIGHT, 0xffffff);

    if (showGround) {
        scene.add.rectangle(600, 632, 1240, 90, 0x000000);
    }
}

function createButton(scene, x, y, w, h, label, onClick) {
    const bg = scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0x111111);
    const text = scene.add.text(x + w / 2, y + h / 2, label, {
        fontFamily: 'Arial',
        fontSize: '19px',
        color: '#ffffff',
        fontStyle: 'bold'
    }).setOrigin(0.5);
    const zone = scene.add.zone(x + w / 2, y + h / 2, w, h)
        .setInteractive();
    zone.input.cursor = 'pointer';

    zone.on('pointerover', () => bg.setFillStyle(0x333333));
    zone.on('pointerout', () => bg.setFillStyle(0x111111));
    zone.on('pointerdown', () => bg.setFillStyle(0x555555));
    zone.on('pointerup', () => {
        bg.setFillStyle(0x333333);
        onClick();
    });

    return { bg, text, zone };
}

function createScoreButton(scene, x, y, w, h, label, onClick) {
    const bg = scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0xe6e6e6)
        .setStrokeStyle(2, 0x555555);
    scene.add.line(0, 0, x, y, x + 10, y + 10, 0xffffff, 1).setOrigin(0, 0).setLineWidth(2);
    scene.add.line(0, 0, x, y, x + w, y, 0xffffff, 1).setOrigin(0, 0).setLineWidth(2);
    scene.add.line(0, 0, x + w, y, x + w - 10, y + 10, 0x777777, 1).setOrigin(0, 0).setLineWidth(2);
    scene.add.line(0, 0, x + w, y + h, x, y + h, 0x777777, 1).setOrigin(0, 0).setLineWidth(2);
    const text = scene.add.text(x + w / 2, y + h / 2, label, {
        fontFamily: 'Arial',
        fontSize: '28px',
        color: '#000000'
    }).setOrigin(0.5);
    const zone = scene.add.zone(x + w / 2, y + h / 2, w, h).setInteractive();

    zone.input.cursor = 'pointer';
    zone.on('pointerover', () => bg.setFillStyle(0xf2f2f2));
    zone.on('pointerout', () => bg.setFillStyle(0xe6e6e6));
    zone.on('pointerup', onClick);

    return { bg, text, zone };
}

function addBlackBlock(scene, x, y, w, h) {
    const body = scene.matter.add.rectangle(x, y, w, h, {
        isStatic: true,
        friction: 1,
        restitution: 0.05
    });

    body.role = 'black';
    scene.add.rectangle(x, y, w, h, 0x000000);

    return body;
}

function addGrayBrick(scene, x, y, w, h) {
    const brick = scene.add.rectangle(x, y, w, h, 0x9b9b9b)
        .setStrokeStyle(2, 0x555555);

    scene.matter.add.gameObject(brick, {
        friction: 0.65,
        frictionAir: 0.004,
        restitution: 0.12,
        density: 0.003
    });
    brick.body.role = 'gray';

    return brick;
}

function drawStar(scene, x, y, radius, filled) {
    scene.add.text(x, y, String.fromCharCode(9733), {
        fontFamily: 'Arial',
        fontSize: `${radius * 2}px`,
        color: filled ? '#ffff00' : '#ffffff',
        stroke: '#444444',
        strokeThickness: 2
    }).setOrigin(0.5);
}

function scoreForTime(elapsedMs, stars) {
    const timePenalty = Math.floor(elapsedMs * 18);

    return Math.max(1000, 300000 + stars * 25000 - timePenalty);
}
