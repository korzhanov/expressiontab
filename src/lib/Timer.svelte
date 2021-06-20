<script>
    import { onMount } from 'svelte';
    // 
    let date = new Date();
    $: hour = ('0' + date.getHours()).slice(-2);
    $: min = ('0' + date.getMinutes()).slice(-2);
    $: sec = ('0' + date.getSeconds()).slice(-2);
    
    onMount( () => {
      const interval = setInterval(() => {
        date = new Date();
      }, 1000);
    });
   </script>

<section class="clock-and-greeting">
    <!-- <div class="user-greeting">
      <h1 id="user-greeting-time">Good evening,&nbsp;</h1>
      <h1 id="user-greeting-name">what's your <button>name</button>?</h1>
      <form id="name-form" style="display: none;">
        <input id="name-input" type="text" maxlength="16">
        <input id="name-submit" type="button" aria-label="submit">
      </form>
    </div> -->

    <div class="time-display">
        <p><span>{hour}</span>:<span>{min}</span>:<span>{sec}</span></p>
    </div>

    <!-- <div class="toggle-pomodoro">
      <button class="start" style="display: none;">Start Pomodoro Cycle</button>
      <button class="stop" style="display: inline-block;">Stop</button>
      <button class="pause" style="display: inline-block;">Pause</button>
      <button class="reset" style="display: inline-block;">Reset</button>
      <button class="work-break" style="display: inline-block;">Break</button>
    </div> -->
</section>

<style lang="postcss">
    
    .clock-and-greeting {
        height: 75%;
        flex-direction: column;        
        font-family: Monoton, Lato, sans-serif;
        /* font-family:  Lato, sans-serif; */
       
    }
    .clock-and-greeting,
    .user-greeting {
        display: flex;
        justify-content: center;
    }
    .time-display {
        display: flex;
        justify-content: center;
        font-weight: 400;
        color: #fff;
        font-size: 8em;
        
    }
    .time-display,
    .time-display p {
        padding: 0;
        margin: 0;
        transition: all 0.3s ease;
        text-shadow: 0 0 20px #0000009d;
    }
    .time-display p:hover {
        transform: scale(1.1);
        transition: all 0.3s ease;
        text-shadow: 0 0 50px #0000009d;

    }
    .time-display p span {
        width:1.5em;
        display: inline-block;
        transition: all 0.3s ease;
    }
    .toggle-pomodoro {
        display: flex;
        justify-content: center;
    }
    .toggle-pomodoro button {
        padding: 3px 10px;
        border-radius: 3px;
        outline: none;
        background-color: transparent;
        border: none;
        color: #fff;
        cursor: pointer;
        font-family: Lato, sans-serif;
        font-size: 1.2em;
        font-weight: 600;
        transition: 0.3s ease;
    }
    .toggle-pomodoro button:hover {
        background-color: rgba(0, 0, 0, 0.5);
        transition: 0.3s ease;
    }
</style>
