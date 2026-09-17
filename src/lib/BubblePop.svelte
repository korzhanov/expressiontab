<script lang="ts">
  /**
   * One-shot лопание пузырька при удалении dial.
   * Мотив: Bubble Preloader — Jon Kantner https://codepen.io/jkantner/pen/poYZMXX
   */
  export let active: boolean = false;
  /** Сколько капель по кругу */
  export let drops: number = 7;

  $: dropAngles = Array.from({ length: drops }, (_, i) => (360 / drops) * i);
</script>

{#if active}
  <div class="bubblePop" aria-hidden="true">
    <!-- Оболочка пузырька (до лопания) -->
    <span class="bubblePop__ball" />
    <span class="bubblePop__shine" />
    <!-- Брызги капель по кругу -->
    {#each dropAngles as angle, i (i)}
      <span class="bubblePop__drop" style="--angle: {angle}deg; --delay: {i * 12}ms" />
    {/each}
  </div>
{/if}

<style lang="scss">
  .bubblePop {
    --hue: 200;
    position: absolute;
    inset: -8px;
    z-index: 3000;
    pointer-events: none;
    display: grid;
    place-items: center;
    filter: drop-shadow(0 2px 4px hsla(0, 0%, 0%, 0.35));
  }

  .bubblePop__ball,
  .bubblePop__shine,
  .bubblePop__drop,
  .bubblePop__drop::before {
    position: absolute;
    display: block;
    content: "";
  }

  /* Сам пузырь — схлопывается */
  .bubblePop__ball {
    width: 72%;
    height: 72%;
    border-radius: 50%;
    box-shadow:
      0 -0.0625em 0 0.0625em hsl(var(--hue), 90%, 95%) inset,
      0 0 0 0.0625em hsl(var(--hue), 90%, 70%) inset,
      0 0 0.25em 0.25em hsla(var(--hue), 90%, 70%, 0.7) inset;
    animation: bubblePopBall 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  .bubblePop__shine {
    width: 62%;
    height: 62%;
    border-radius: 50%;
    background-image: radial-gradient(
      25% 10% at 50% 5%,
      hsl(0, 0%, 100%) 48%,
      hsla(0, 0%, 100%, 0) 50%
    );
    transform: rotate(-45deg);
    animation: bubblePopShine 0.65s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }

  /* Капли разлетаются от центра */
  .bubblePop__drop {
    top: 50%;
    left: 50%;
    width: 0.2em;
    height: 0.55em;
    transform: translate(-50%, -50%) rotate(var(--angle));
    transform-origin: 50% 0;
  }
  .bubblePop__drop::before {
    top: 0;
    left: 50%;
    width: 100%;
    height: 100%;
    margin-left: -50%;
    border-radius: 0.08em;
    background-color: hsl(var(--hue), 90%, 80%);
    transform-origin: 50% 0;
    animation: bubblePopDrop 0.65s cubic-bezier(0.33, 1, 0.68, 1) forwards;
    animation-delay: var(--delay);
  }

  @keyframes bubblePopBall {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    45% {
      transform: scale(1.15);
      opacity: 1;
    }
    70% {
      transform: scale(0.35);
      opacity: 0.85;
    }
    100% {
      transform: scale(0);
      opacity: 0;
    }
  }

  @keyframes bubblePopShine {
    0% {
      transform: rotate(-45deg) scale(1);
      opacity: 1;
    }
    45% {
      transform: rotate(-45deg) scale(1.12);
      opacity: 1;
    }
    100% {
      transform: rotate(-45deg) scale(0);
      opacity: 0;
    }
  }

  @keyframes bubblePopDrop {
    0% {
      visibility: hidden;
      transform: translateY(0) scaleY(0);
      opacity: 0;
    }
    35% {
      visibility: visible;
      transform: translateY(0) scaleY(1);
      opacity: 1;
    }
    100% {
      transform: translateY(420%) scaleY(0.2);
      opacity: 0;
    }
  }
</style>
