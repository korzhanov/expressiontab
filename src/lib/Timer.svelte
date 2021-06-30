<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    // 
    // let date:any = new Date();
    let date:any = 0;
    let interval:any;
    $: hour = ('0' + ((date / (1000 * 60 * 60) % 24)|0)).slice(-2);
    $: min = ('0' + ((date / 1000 / 60 % 60)|0)).slice(-2);
    $: sec = ('0' + ((date/ 1000 % 60)|0)).slice(-2);
    $: msec = ('0' +((date/100)|0)).slice(-2);
   
    onMount( () => {
      interval = setInterval(() => {
        let dateNow:any = new Date();
        let tomorrow:any = new Date(dateNow.getFullYear(), dateNow.getMonth(), dateNow.getDate() + 1);
        date = new Date(tomorrow - dateNow);
      }, 1000);
    });
    onDestroy( () => {
      clearInterval(interval);
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
        <p><span>{hour}</span>:<span>{min}</span>:<span>{sec}</span>
            <!-- <span>:{msec}</span> -->
        </p>
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
        /* font-family: Monoton, Lato, sans-serif; */
        font-family:  Lato, sans-serif;
       
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
        transform: scale(1.03);
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
