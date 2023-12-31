import Phaser from 'phaser'

const createTreasureAnims = (anims: Phaser.Animations.AnimationManager) => {
    anims.create({
        key: 'chest-open',
        frames: anims.generateFrameNames('treasure', { start: 0, end: 2, prefix: 'chest_empty_open_anim_f', suffix: '.png' }),
        repeat: 0,
        frameRate: 5,
    })

    anims.create({
        key: 'chest-closed',
        frames: [{ key: 'treasure', frame: 'chest_empty_open_anim_f0.png' }],
    })
}

export { createTreasureAnims }
