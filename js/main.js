const scene = new THREE.Scene() // kreiranje scene
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 ) //da bi videli scenu kreiramo kameru

const renderer = new THREE.WebGLRenderer() // renderuje grafiku
renderer.setSize( window.innerWidth, window.innerHeight ) //postavljamo render da bude velicine prozora 
document.body.appendChild( renderer.domElement ) // renderer daje canvas koji dodajemo na body


renderer.setClearColor(0xb7c3f3, 1); // postavljanje boje pozadine 

const light = new THREE.AmbientLight( 0xffffff ); // soft white light
scene.add( light ); //dodajemo osvetljenje na scenu da bi se videla lutka

//globalne varjiable
const start_position = 3;
const end_position = -start_position;
const text = document.querySelector(".text");
const TIME_LIMIT = 10;
let gameStat = "loading";
let isLookingBackward = true;

function createCube(size, positionX, rotY = 0, color = 0xfbc851) {
    const geometry = new THREE.BoxGeometry( size.w, size.h, size.d); // kreira box kao geometrijski oblike
    const material = new THREE.MeshBasicMaterial( { color: color } ); //dodaje materijal na njega u ovom slucaju samo boju
    const cube = new THREE.Mesh( geometry, material ); //reiramo mesh kombinacijom prethodna dva
    cube.position.x = positionX;
    cube.rotation.y = rotY;
    scene.add( cube ); //dodajemo kocku 
    return cube;
}

camera.position.z = 5; // koliko daleko ce biti kamera


const loader = new THREE.GLTFLoader()

function delay(ms) { //fja za kasnjenje okretanja lutke
    return new Promise(resolve => setTimeout(resolve, ms));
}

// kreirana klasa za lutku kako bi moble da se pozivajumetode nad njom 
class Doll{
    constructor() {
        loader.load("../model/scene.gltf", (gltf) => {
            scene.add(gltf.scene);
            gltf.scene.scale.set(.4, .4, .4); //smanjujemo model da bi stao u okviru ekrana
            gltf.scene.position.set(0, -1, 0); // spustanje lutke na sredinu ekrana 
            this.doll = gltf.scene;
        })
    }

    lookBackward() { //metoda za okretanje lutke
        // this.doll.rotation.y = -3.15;

        gsap.to(this.doll.rotation, {y:-3.15, duration: .45}) //uy pomoc bilbioteke gsap pravimo animaciju za rotiranje lutke
        setTimeout(() => {
            isLookingBackward = true;
        }, 150)
    }
    lookForward() {
        gsap.to(this.doll.rotation, {y:0, duration: .45}) //uy pomoc bilbioteke gsap pravimo animaciju za rotiranje lutke
        setTimeout(() => {
            isLookingBackward = false;
        },450)
    }
    async start() {
        this.lookBackward()
        await delay((Math.random() * 1000 + 1000))
        this.lookForward()
        await delay((Math.random() * 750 + 750))
        this.start()
    }

}

function createTrack() {
    createCube({w: start_position * 2 + .21, h: 1.5, d: 1}, 0, 0, 0xe5a716).position.z = -1;
 // mnozimo sa 2 pocetnu poziciju da bi dobili traku od kocki
    createCube({w: .2, h: 1.5, d:1}, start_position, -.35);
    createCube({w: .2, h: 1.5, d:1}, end_position, .35);
}
createTrack();

class Player {
    constructor() {
        const geometry = new THREE.SphereGeometry( .3, 32, 16 )
        const material = new THREE.MeshBasicMaterial( { color:0xffffff } )
        const sphere = new THREE.Mesh( geometry, material )
         sphere.position.z = 1;
         sphere.position.x = start_position;
        scene.add( sphere )
        this.player = sphere;
        this.playerInfo = {
            positionX: start_position,
            velocity: 0
        }
    }

    run() {
        this.playerInfo.velocity = .03;
    }
  
    stop() {
        // this.playerInfo.velocity = 0;
        gsap.to(this.playerInfo, {velocity:0, duration:.1})
    }

    check() {
        if(this.playerInfo.velocity > 0 && !isLookingBackward) {
            gameStat = "over";
            text.innerText = "You lost";
        } 
        if(this.playerInfo.positionX < end_position + .4) {
            gameStat="over";
            text.innerText = "You won";
        }
    }

    update() {
        this.check();
        this.playerInfo.positionX -=this.playerInfo.velocity;
        this.player.position.x = this.playerInfo.positionX;
    }
}


const player = new Player();

let doll = new Doll(); //pravimo objekat klase doll


//game logic
async function init() {
    await delay(500)
    text.innerText = "Starting in 3";
    await delay(500)
    text.innerText = "Starting in 2";
    await delay(500)
    text.innerText = "Starting in 1";
    await delay(500)
    text.innerText = "GO!";
    startGame();
}

function startGame() {
    gameStat = "started"
    let progressBar = createCube({w: 5, h:.1, d:1}, 0);
    progressBar.position.y = 3.35;
    gsap.to(progressBar.scale, {x: 0, duration: TIME_LIMIT,ease:'none'})
    setTimeout(()=>{
        if(gameStat != "over") {
            text.innerText = "You ran out of time!";
            gameStat = "over";
        }
    },TIME_LIMIT * 1000)
    doll.start();
}
init();


function animate() { // da se ne bi render pozivao svaki put da se nesto prikaze, pravi se rekurzivna fja koja ga poziva nonstop
    if(gameStat == "over") return;
    renderer.render( scene, camera );
    requestAnimationFrame( animate );
    player.update();
}
animate();


//resavanje responsiva 
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('keydown', (e)=> {
    if(gameStat != "started") return
    if(e.key == "ArrowUp") {
        player.run();
    }
})

window.addEventListener('keyup', (e)=> {
    if(e.key == "ArrowUp") {
        player.stop();
    }
})
