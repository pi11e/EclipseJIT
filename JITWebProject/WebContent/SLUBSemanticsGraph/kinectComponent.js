/**
 * 
 */

console.log(this);
this.kinectComponent = {global: this}; // global component instance with reference to global context; this = window (usually)


//console.log("kinectComponent initialized: " + kinectComponent);