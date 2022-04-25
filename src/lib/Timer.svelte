<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { fly } from "svelte/transition";

  let timerType: number = 0;
  let hour: string = "";
  let min: string = "";
  let sec: string = "";
  let date: any = new Date();
  let interval: any;
  $: timerSwitch(timerType,date);

  function timerSwitch(timerType,date) {
    switch (timerType) {
      case 0:
        hour = ("0" + (23 - date.getHours())).slice(-2);
        min = ("0" + (59 - date.getMinutes())).slice(-2);
        sec = ("0" + (59 - date.getSeconds())).slice(-2);
        break;
      case 1:
        hour = ("0" + date.getHours()).slice(-2);
        min = ("0" + date.getMinutes()).slice(-2);
        sec = ("0" + date.getSeconds()).slice(-2);
        break;
    }
  }

  onMount(() => {
    interval = setInterval(() => {
      date = new Date();
    }, 1000);
  });
  onDestroy(() => {
    clearInterval(interval);
  });
</script>

<clock-and-greeting>
  <time-display
    on:click={() => {
      timerType + 1 > 1 ? (timerType = 0) : timerType++;
    }}
  >
    <p>
      {#key hour}<span in:fly={{ y: -20 }}>{hour}</span>{/key}:
      {#key min}<span in:fly={{ y: -20 }}>{min}</span>{/key}:
      {#key sec}<span in:fly={{ y: -20 }}>{sec}</span> {/key}
      <!-- <span>:{msec}</span> -->
    </p>
  </time-display>

  <!-- @todo Pomodoro timer -->
  <!-- <div class="toggle-pomodoro">
      <button class="start" style="display: none;">Start Pomodoro Cycle</button>
      <button class="stop" style="display: inline-block;">Stop</button>
      <button class="pause" style="display: inline-block;">Pause</button>
      <button class="reset" style="display: inline-block;">Reset</button>
      <button class="work-break" style="display: inline-block;">Break</button>
    </div> -->
</clock-and-greeting>

<style>
  clock-and-greeting {
    height: 75%;
    flex-direction: column;
    /* font-family: Monoton, Lato, sans-serif; */
    font-family: Lato, sans-serif;
  }
  clock-and-greeting {
    display: flex;
    justify-content: center;
  }
  time-display {
    display: flex;
    justify-content: center;
    font-weight: 300;
    color: #fff;
    font-size: 12vw;
  }
  time-display,
  time-display p {
    padding: 0;
    margin: 0;
    /* transition: all 0.3s ease; */
    text-shadow: 0 0 50px #0000009d;
  }
  time-display p:hover {
    /* transform: scale(1.03); */
    transition: all 0.3s ease;
    /* text-shadow: 0 0 50px #0000009d; */
  }
  time-display p span {
    width: 1.5em;
    display: inline-block;
    transition: all 0.3s ease;
  }
  /* // .toggle-pomodoro {
    //     display: flex;
    //     justify-content: center;
    // }
    // .toggle-pomodoro button {
    //     padding: 3px 10px;
    //     border-radius: 3px;
    //     outline: none;
    //     background-color: transparent;
    //     border: none;
    //     color: #fff;
    //     cursor: pointer;
    //     font-family: Lato, sans-serif;
    //     font-size: 1.2em;
    //     font-weight: 600;
    //     transition: 0.3s ease;
    // }
    // .toggle-pomodoro button:hover {
    //     background-color: rgba(0, 0, 0, 0.5);
    //     transition: 0.3s ease;
    // } */
</style>
