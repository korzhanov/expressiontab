<script>
    
  import { fade } from "svelte/transition";
  import { tweened } from "svelte/motion";
  import { cubicOut } from "svelte/easing";
      let m = { x: 0, y: 0 };

const circleTransitiom = tweened(0, {
  duration: 700,
  easing: cubicOut,
});
circleTransitiom.set(10);
</script>

<main
  in:fade={{ duration: 1000 }}
  out:fade={{ duration: 1000 }}
  on:mousemove={(e) => (m = { x: e.clientX, y: e.clientY })}
  on:click={() => circleTransitiom.set(30000)}
/>
<circ
  style="top:{m.y - $circleTransitiom / 2}px;
  left:{m.x - $circleTransitiom / 2}px; 
  width: {$circleTransitiom}px;
  height: {$circleTransitiom}px;"
/>
<svg
  style="top:{m.y}px;left:{m.x}px;
  width: {$circleTransitiom}px;
  height: {$circleTransitiom}px;"
>
  <circle cx="50%" cy="50%" r={$circleTransitiom} />
</svg>

<style>
  circ {
    position: absolute;
    display: block;
    background-color: #ffffff;
    border-radius: 50%;
    width: 0px;
    height: 0px;
    z-index: 1000000;
    transition: all 0.31s ease-in-out;
  }

  svg {
    position: fixed;

    margin: -8px;
  }
  
  circle {
    fill: #ffffff;
  }
</style>
