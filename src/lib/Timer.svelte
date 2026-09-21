<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { fly } from "svelte/transition";
  import {
    isTimerVisible,
    loadTimerMode,
    nextTimerMode,
    saveTimerMode,
    TIMER_MODE_CLOCK,
    TIMER_MODE_COUNTDOWN,
    type TimerMode,
  } from "./timer-mode";

  // Режим: 0 countdown / 1 clock / 2 hidden — клик по кругу
  let timerType: TimerMode = TIMER_MODE_COUNTDOWN;
  let hour: string = "";
  let min: string = "";
  let sec: string = "";
  let date: Date = new Date();
  let interval: ReturnType<typeof setInterval> | undefined;

  // Пересчёт цифр при смене режима или тике
  $: if (isTimerVisible(timerType)) timerSwitch(timerType, date);

  function timerSwitch(mode: TimerMode, d: Date) {
    if (mode === TIMER_MODE_COUNTDOWN) {
      // Обратный отсчёт до полуночи
      hour = ("0" + (23 - d.getHours())).slice(-2);
      min = ("0" + (59 - d.getMinutes())).slice(-2);
      sec = ("0" + (59 - d.getSeconds())).slice(-2);
      return;
    }
    if (mode === TIMER_MODE_CLOCK) {
      // Обычные часы
      hour = ("0" + d.getHours()).slice(-2);
      min = ("0" + d.getMinutes()).slice(-2);
      sec = ("0" + d.getSeconds()).slice(-2);
    }
  }

  /** Клик: следующий режим по кругу + persist */
  function onClockClick() {
    timerType = nextTimerMode(timerType);
    saveTimerMode(timerType);
    syncTick();
  }

  /** Тикер только когда часы видны */
  function syncTick() {
    if (interval) {
      clearInterval(interval);
      interval = undefined;
    }
    if (!isTimerVisible(timerType)) return;
    date = new Date();
    interval = setInterval(() => {
      date = new Date();
    }, 1000);
  }

  onMount(() => {
    timerType = loadTimerMode();
    syncTick();
  });
  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
</script>

<clock-and-greeting class:hidden={!isTimerVisible(timerType)}>
  {#if isTimerVisible(timerType)}
    <time-display
      role="button"
      tabindex="0"
      title="Click: countdown → clock → hide"
      on:click={onClockClick}
      on:keydown={(e) =>
        (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onClockClick())}
    >
      <p>
        {#key hour}<span in:fly={{ y: -20 }}>{hour}</span>{/key}:
        {#key min}<span in:fly={{ y: -20 }}>{min}</span>{/key}:
        {#key sec}<span in:fly={{ y: -20 }}>{sec}</span>{/key}
      </p>
    </time-display>
  {:else}
    <!-- Зона возврата после «выкл» на третьем клике -->
    <button
      type="button"
      class="clockRestore"
      title="Show clock"
      aria-label="Show clock"
      on:click={onClockClick}
    ></button>
  {/if}

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
    display: flex;
    justify-content: center;
  }
  clock-and-greeting.hidden {
    /* Скрытый режим: компактная зона клика, без гигантских цифр */
    height: auto;
    min-height: 48px;
    align-items: center;
  }
  time-display {
    display: flex;
    left: 0;
    top: 0;
    justify-content: center;
    /* font-weight: 300; */
    color: #fff;
    font-size: 12vw;
    cursor: pointer;
    /* transform: translateZ(0px); */
  }
  time-display,
  time-display p {
    padding: 0;
    margin: 0;
    /* transition: all 0.3s ease; */
    text-shadow: 0 0 50px #0000009d;
  }
  /* time-display p:hover { */
  /* transform: scale(1.03); */
  /* transition: all 0.3s ease; */
  /* text-shadow: 0 0 50px #0000009d; */
  /* } */
  time-display p span {
    width: 1.5em;
    display: inline-block;
    transition: transition 0.3s ease;
  }
  .clockRestore {
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.12);
    cursor: pointer;
    padding: 0;
  }
  .clockRestore:hover {
    background: rgba(255, 255, 255, 0.22);
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
