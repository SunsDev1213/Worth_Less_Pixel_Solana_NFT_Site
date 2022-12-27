import * as React from "react";
import * as THREE from "three";
import * as THREEBAS from "three-bas";

import gsap from "gsap";

import THREERoot from "./threeRoot.js";

gsap.defaults({ overwrite: "auto" });

let imageList = [];
for (let i = 0; i < 20; i++) {
  imageList.push(
    "https://worthlesspixels.com/nftImages/" +
      +Math.floor(Math.random() * 776) +
      ".png"
  );
}

export const GalleryElement = () => {
  const ref = React.useRef(null);
  const animate = (renderer, scene, camera) => {
    requestAnimationFrame(() => {
      animate(renderer, scene, camera);
    });
    renderer.render(scene, camera);
  };

  const loadNextImages = (images, index, slide0, slide1) => {
    let first = index;
    let second;
    const tmp = (first + 1) % images.length;
    if (index % 2 === 0) {
      second = tmp;
    } else {
      second = first;
      first = tmp;
    }
    new THREE.ImageLoader().load(images[first], function (image) {
      slide0.setImage(image);
    });
    new THREE.ImageLoader().load(images[second], function (image) {
      slide1.setImage(image);
    });

    return tmp;
  };

  React.useEffect(() => {
    let slide0, slide1;
    let index = 0;

    var root = new THREERoot({
      fov: 80,
      createCameraControls: false,
      container: ref.current
    });

    // width and height for the THREE.PlaneGeometry that will be used for the two slides
    var width = 50;
    var height = 30;
    slide0 = new Slide(width, height, "out");
    root.scene.add(slide0);
    slide1 = new Slide(width, height, "in");
    root.scene.add(slide1);
    root.camera.position.set(0, 0, 60);

    const timeline = gsap.timeline({
      repeat: -1,
      repeatDelay: 2,
      yoyo: true,
      onRepeat: () =>
        (index = loadNextImages(imageList, index, slide0, slide1)),
    });
    timeline.add(slide0.transition(), 0);
    timeline.add(slide1.transition(), 0);
    index = loadNextImages(imageList, index, slide0, slide1);
    animate(root.renderer, root.scene, root.camera);
  });

  return (
    <div className="imageTest">
      <div ref={ref} />
    </div>
  );
};

////////////////////
// CLASSES
////////////////////

function Slide(width, height, animationPhase) {
  // create a geometry that will be used by BAS.ModelBufferGeometry
  // its a plane with a bunch of segments
  var plane = new THREE.PlaneGeometry(width, height, width * 2, height * 2);

  // duplicate some vertices so that each face becomes a separate triangle.
  // this is the same as the THREE.ExplodeModifier
  THREEBAS.Utils.separateFaces(plane);

  // create a ModelBufferGeometry based on the geometry created above
  // ModelBufferGeometry makes it easier to create animations based on faces of a geometry
  // it is similar to the PrefabBufferGeometry where the prefab is a face (triangle)
  var geometry = new THREEBAS.ModelBufferGeometry(plane, {
    // setting this to true will store the vertex positions relative to the face they are in
    // this way it's easier to rotate and scale faces around their own center
    localizeFaces: true,
    // setting this to true will store a centroid for each face in an array
    computeCentroids: true,
  });

  // buffer UVs so the textures are mapped correctly
  geometry.bufferUvs();

  var i, j, offset, centroid;

  // ANIMATION

  var aDelayDuration = geometry.createAttribute("aDelayDuration", 2);
  // these will be used to calculate the animation delay and duration for each face
  var minDuration = 0.8;
  var maxDuration = 1.2;
  var maxDelayX = 0.9;
  var maxDelayY = 0.125;
  var stretch = 0.11;

  this.totalDuration = maxDuration + maxDelayX + maxDelayY + stretch;

  for (i = 0, offset = 0; i < geometry.faceCount; i++) {
    centroid = geometry.centroids[i];

    var duration = THREE.Math.randFloat(minDuration, maxDuration);
    // delay is based on the position of each face within the original plane geometry
    // because the faces are localized, this position is available in the centroids array
    var delayX = THREE.Math.mapLinear(
      centroid.x,
      -width * 0.5,
      width * 0.5,
      0.0,
      maxDelayX
    );
    var delayY;

    // create a different delayY mapping based on the animation phase (in or out)
    if (animationPhase === "in") {
      delayY = THREE.Math.mapLinear(
        Math.abs(centroid.y),
        0,
        height * 0.5,
        0.0,
        maxDelayY
      );
    } else {
      delayY = THREE.Math.mapLinear(
        Math.abs(centroid.y),
        0,
        height * 0.5,
        maxDelayY,
        0.0
      );
    }

    // store the delay and duration FOR EACH VERTEX of the face
    for (j = 0; j < 3; j++) {
      // by giving each VERTEX a different delay value the face will be 'stretched' in time
      aDelayDuration.array[offset] =
        delayX + delayY + Math.random() * stretch * duration;
      aDelayDuration.array[offset + 1] = duration;

      offset += 2;
    }
  }

  // POSITIONS

  // the transitions will begin and end on the same position
  var aStartPosition = geometry.createAttribute(
    "aStartPosition",
    3,
    function (data, i) {
      geometry.centroids[i].toArray(data);
    }
  );
  var aEndPosition = geometry.createAttribute(
    "aEndPosition",
    3,
    function (data, i) {
      geometry.centroids[i].toArray(data);
    }
  );

  console.log(aStartPosition, aEndPosition);

  // CONTROL POINTS

  // each face will follow a bezier path
  // since all paths begin and end on the position (the centroid), the control points will determine how the animation looks
  var aControl0 = geometry.createAttribute("aControl0", 3);
  var aControl1 = geometry.createAttribute("aControl1", 3);

  var control0 = new THREE.Vector3();
  var control1 = new THREE.Vector3();
  var data = [];

  for (i = 0, offset = 0; i < geometry.faceCount; i++) {
    centroid = geometry.centroids[i];

    // the logic to determine the control points is completely arbitrary
    var signY = Math.sign(centroid.y);

    control0.x = THREE.Math.randFloat(0.1, 0.3) * 50;
    control0.y = signY * THREE.Math.randFloat(0.1, 0.3) * 70;
    control0.z = THREE.Math.randFloatSpread(20);

    control1.x = THREE.Math.randFloat(0.3, 0.6) * 50;
    control1.y = -signY * THREE.Math.randFloat(0.3, 0.6) * 70;
    control1.z = THREE.Math.randFloatSpread(20);

    if (animationPhase === "in") {
      control0.subVectors(centroid, control0);
      control1.subVectors(centroid, control1);
    } else {
      // out
      control0.addVectors(centroid, control0);
      control1.addVectors(centroid, control1);
    }

    // store the control points per face
    // this is similar to THREE.PrefabBufferGeometry.setPrefabData
    geometry.setFaceData(aControl0, i, control0.toArray(data));
    geometry.setFaceData(aControl1, i, control1.toArray(data));
  }

  var texture = new THREE.Texture();
  texture.minFilter = THREE.NearestFilter;

  var material = new THREEBAS.BasicAnimationMaterial({
    flatShading: true,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
    },
    uniformValues: {
      map: texture,
    },
    vertexFunctions: [
      THREEBAS.ShaderChunk["cubic_bezier"],
      THREEBAS.ShaderChunk["ease_cubic_in_out"],
      THREEBAS.ShaderChunk["quaternion_rotation"],
    ],
    vertexParameters: [
      "uniform float uTime;",
      "attribute vec2 aDelayDuration;",
      "attribute vec3 aStartPosition;",
      "attribute vec3 aControl0;",
      "attribute vec3 aControl1;",
      "attribute vec3 aEndPosition;",
    ],
    vertexInit: [
      "float tProgress = clamp(uTime - aDelayDuration.x, 0.0, aDelayDuration.y) / aDelayDuration.y;",
    ],
    vertexPosition: [
      // this scales each face
      // for the in animation, we want to go from 0.0 to 1.0
      // for the out animation, we want to go from 1.0 to 0.0
      animationPhase === "in"
        ? "transformed *= tProgress;"
        : "transformed *= 1.0 - tProgress;",
      // translation based on the bezier curve defined by the attributes
      "transformed += cubicBezier(aStartPosition, aControl0, aControl1, aEndPosition, tProgress);",
    ],
  });

  THREE.Mesh.call(this, geometry, material);

  this.frustumCulled = false;
}
Slide.prototype = Object.create(THREE.Mesh.prototype);
Slide.prototype.constructor = Slide;
Object.defineProperty(Slide.prototype, "time", {
  get: function () {
    return this.material.uniforms["uTime"].value;
  },
  set: function (v) {
    this.material.uniforms["uTime"].value = v;
  },
});

Slide.prototype.setImage = function (image) {
  this.material.uniforms.map.value.image = image;
  this.material.uniforms.map.value.needsUpdate = true;
};

Slide.prototype.transition = function (time) {
  return gsap.fromTo(
    this,
    {
      time: 0.0,
    },
    {
      duration: 3,
      // delay: time,
      time: this.totalDuration,
      ease: "power0.inOut",
      onStart: () => {
        console.log("transition start: ", time);
      },
      onComplete: () => {
        console.log(
          "transition forward done: ",
          time,
          "visible: ",
          this.visible
        );
      },
      onReverseComplete: () => {
        console.log("transition back done: ", time);
      },
    }
  );
};
