import Phaser from 'phaser'
import { createLizardAnims } from '../anims/EnemyAnims'
import { createCharacterAnims } from '../anims/CharacterAnims'
import Lizard from '../enemies/Lizard'
import '../characters/Fauna'
import Fauna from '../characters/Fauna'
import { sceneEvents } from '../events/EventsCenter'
import { createTreasureAnims } from '../anims/TreasureAnims'
import Chest from '../items/Chests'

export default class Game extends Phaser.Scene {
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
    private fauna!: Fauna
    private knives!: Phaser.Physics.Arcade.Group
    private lizards!: Phaser.Physics.Arcade.Group
    private playerLizardCollider?: Phaser.Physics.Arcade.Collider

    constructor() {
        super('game')
    }

    preload() {
        this.cursors = this.input.keyboard.createCursorKeys()
        // const keyRestart = this.input.keyboard.addKey('EXC')
        this.input.keyboard.on('keyup-' + 'ESC', () => {
            console.log('Game Restarted!!!')
            this.scene.restart()
        })
    }

    create() {
        this.scene.run('game-ui')

        createCharacterAnims(this.anims)
        createLizardAnims(this.anims)
        createTreasureAnims(this.anims)

        const map = this.make.tilemap({ key: 'dungeon' })
        const tileset = map.addTilesetImage('dungeon', 'tiles', 16, 16, 1, 2)

        map.createLayer('Ground', tileset)

        const chests = this.physics.add.staticGroup({ classType: Chest })
        const chestsLayer = map.getObjectLayer('Chests')
        chestsLayer.objects.forEach((chestObj) => {
            chests.get(
                chestObj.x! + chestObj.width! * 0.5,
                chestObj.y! - chestObj.height! * 0.5,
                'treasure',
                'chest_empty_open_anim_f0.png'
            )
        })

        // const chest = this.add.sprite(64, 64, 'treasure', 'chest_empty_open_anim_f0.png')
        // this.time.delayedCall(500, () => {
        //     chest.anims.play('chest-open')
        // })

        this.knives = this.physics.add.group({
            classType: Phaser.Physics.Arcade.Image,
            maxSize: 3,
        })

        const wallsLayer = map.createLayer('Walls', tileset)
        wallsLayer.setCollisionByProperty({ collides: true })

        // for debug
        // debugDraw(wallsLayer, this)
        this.fauna = this.add.fauna(128, 128, 'fauna')
        // this.fauna = new Fauna(this, 128, 128, 'fauna')
        // this.physics.world.enableBody(this.fauna, Phaser.Physics.Arcade.DYNAMIC_BODY)
        // this.fauna.body.setSize(this.fauna.width * 0.5, this.fauna.height * 0.8)
        this.fauna.setKnives(this.knives)

        this.cameras.main.startFollow(this.fauna, true)

        this.lizards = this.physics.add.group({
            classType: Lizard,
            createCallback: (go) => {
                const lizGO = go as Lizard
                lizGO.body.onCollide = true
            },
        })

        const lizardsLayer = map.getObjectLayer('Lizards')
        lizardsLayer.objects.forEach((lizObj) => {
            this.lizards.get(lizObj.x! + lizObj.width! * 0.5, lizObj.y! - lizObj.height! * 0.5, 'lizard')
        })

        // this.lizards.get(256, 128, 'lizard')
        // const lizard = this.physics.add.sprite(256, 128, 'lizard', 'lizard_m_idle_anim_f0.png')
        // const lizard = new Lizard(this, 256, 128, 'lizard', 'lizard_m_idle_anim_f0.png')

        this.physics.add.collider(this.fauna, wallsLayer)
        this.physics.add.collider(this.lizards, wallsLayer)

        this.physics.add.collider(this.fauna, chests, this.handlePlayerChestCollision, undefined, this)
        this.physics.add.collider(this.lizards, chests)

        this.physics.add.collider(this.knives, chests, this.handleKniveChestCollision, undefined, this)
        this.physics.add.collider(this.knives, wallsLayer, this.handleKniveWallCollision, undefined, this)
        this.physics.add.collider(this.knives, this.lizards, this.handleKniveLizardCollision, undefined, this)

        this.playerLizardCollider = this.physics.add.collider(this.lizards, this.fauna, this.handlePlayerLizardCollision, undefined, this)
    }

    private handlePlayerChestCollision(obj1: Phaser.GameObjects.GameObject, obj2: Phaser.GameObjects.GameObject) {
        // console.error(obj1)
        // console.error(obj2)
        const chest = obj2 as Chest
        this.fauna.setChest(chest)
    }

    private handleKniveChestCollision(obj1: Phaser.GameObjects.GameObject, obj2: Phaser.GameObjects.GameObject) {
        // const knife = obj1
        this.knives.killAndHide(obj1)
        obj1.destroy(true)
    }

    private handleKniveWallCollision(obj1: Phaser.GameObjects.GameObject, obj2: Phaser.GameObjects.GameObject) {
        // const knife = obj1
        this.knives.killAndHide(obj1)
        obj1.destroy(true)
    }

    private handleKniveLizardCollision(obj1: Phaser.GameObjects.GameObject, obj2: Phaser.GameObjects.GameObject) {
        // const knife = obj1
        this.knives.killAndHide(obj1)
        this.lizards.killAndHide(obj2)
        obj2.destroy(true)
        obj1.destroy(true)
    }

    private handlePlayerLizardCollision(obj1: Phaser.GameObjects.GameObject, obj2: Phaser.GameObjects.GameObject) {
        const lizard = obj2 as Lizard
        const dx = this.fauna.x - lizard.x
        const dy = this.fauna.y - lizard.y

        const dir = new Phaser.Math.Vector2(dx, dy).normalize().scale(200)

        this.fauna.handleDamage(dir)

        sceneEvents.emit('player-health-changed', this.fauna.health)

        if (this.fauna.health <= 0) {
            this.playerLizardCollider?.destroy()
        }
    }

    update(t: number, dt: number) {
        // if (Phaser.Input.Keyboard.JustDown(Phaser.Input.Keyboard.Key.)) {
        //     this.scene.restart()
        // }
        this.fauna?.update(this.cursors)
    }
}
