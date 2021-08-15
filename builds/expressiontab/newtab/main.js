import { S as SvelteComponent, i as init, s as safe_not_equal, a as append_styles, e as element, b as space, t as text, c as set_style, d as attr, f as toggle_class, g as insert, h as append, l as listen, j as stop_propagation, p as prevent_default, u as update_slot_base, k as get_all_dirty_from_scope, m as get_slot_changes, n as transition_in, o as add_render_callback, q as create_in_transition, r as fly, v as create_out_transition, w as detach, x as group_outros, y as transition_out, z as check_outros, A as set_data, B as create_component, C as mount_component, D as destroy_component, E as run_all, F as create_bidirectional_transition, G as quintOut, H as scale, I as empty, J as create_slot, K as Icon, L as Star, M as Duplicate, _ as __awaiter, N as tick, O as assign, P as get_spread_update, Q as get_spread_object, R as action_destroyer, T as update_keyed_each, U as outro_and_destroy_block, V as svg_element, W as set_input_value, X as add_resize_listener, Y as onMount, Z as onDestroy, $ as globals, a0 as cubicOut, a1 as draw, a2 as set_custom_element_data, a3 as noop, a4 as persist, a5 as localStorage$1, a6 as writable, a7 as component_subscribe, a8 as fade, a9 as tweened, aa as set_store_value } from "../vendor.e43cc997.js";
var firstbg = "/assets/expression-drops-xfactorial-com-copyright.a24d8b19.jpg";
function add_css$4(target) {
  append_styles(target, "svelte-1mbhmiv", '@-webkit-keyframes svelte-1mbhmiv-width-grow{0%{width:0px}100%{width:auto}}@keyframes svelte-1mbhmiv-width-grow{0%{width:0px}100%{width:auto}}anchoricon.svelte-1mbhmiv.svelte-1mbhmiv.svelte-1mbhmiv{height:18px;width:18px;margin:6px;transform:scale(1.2);background-repeat:no-repeat;background-position:center;border-radius:2px;background-image:url("../assets/Globe.svg");background-size:contain;filter:drop-shadow(3px 1px 4px rgba(20, 20, 20, 0.52))}anchoricon.subicon.svelte-1mbhmiv.svelte-1mbhmiv.svelte-1mbhmiv{position:absolute;z-index:-1;opacity:0.2;transform:scale(0.9) translate(16px, -8px);border-radius:4px}@-webkit-keyframes width-grow-anchor{0%{width:50px}100%{width:auto}}@keyframes width-grow-anchor{0%{width:50px}100%{width:auto}}anchor.svelte-1mbhmiv.svelte-1mbhmiv.svelte-1mbhmiv{--background:#ffffff;--text:black;position:relative;width:50px;height:50px;border-radius:50px;margin:2px;border:10px solid transparent;text-overflow:ellipsis;display:block;position:relative;padding-right:0px;box-sizing:border-box;-webkit-animation:-global-width-grow-anchor 1s cubic-bezier(0.455, 0.03, 0.515, 0.955) both;animation:-global-width-grow-anchor 1s cubic-bezier(0.455, 0.03, 0.515, 0.955) both;transition:all 0.6s ease}anchor.svelte-1mbhmiv bgcircle.svelte-1mbhmiv.svelte-1mbhmiv{width:30px;height:30px;background-color:rgba(31, 30, 30, 0.65);background-repeat:no-repeat;background-position:center;background-size:contain;border-radius:50px;position:absolute;left:0;top:0;z-index:-1;filter:brightness(1) contrast(1) saturate(1.3) blur(5px);box-shadow:5px 5px 10px #222}anchor.isBookmark.svelte-1mbhmiv.svelte-1mbhmiv.svelte-1mbhmiv{background-color:#484848;border-width:7px !important;border-color:#353535;border-style:solid;padding:3px}anchor.svelte-1mbhmiv .multiButton.svelte-1mbhmiv.svelte-1mbhmiv{z-index:-1000;position:absolute;top:1.25rem;left:1.25rem;border-radius:100%;width:0rem;height:0rem;opacity:0;transform:translate(-50%, -50%);transition:0.25s cubic-bezier(0.25, 0, 0, 1) 1.5s}anchor.svelte-1mbhmiv .multiButton.svelte-1mbhmiv.svelte-1mbhmiv:hover{z-index:1000}anchor.svelte-1mbhmiv .multiButton button.svelte-1mbhmiv.svelte-1mbhmiv{display:grid;place-items:center;position:absolute;width:2rem;height:2rem;border:none;border-radius:100%;background:var(--background);color:var(--text);transform:translate(-50%, -50%);cursor:pointer;transition:left, top 0.25s cubic-bezier(0.25, 0, 0, 1) 1.5s;box-shadow:0 0 0rem -0.25rem var(--background)}anchor.svelte-1mbhmiv .multiButton button.svelte-1mbhmiv.svelte-1mbhmiv:hover{background:var(--text);color:var(--background);box-shadow:0 0 1rem -0.25rem var(--background)}anchor.svelte-1mbhmiv .multiButton button.isBookmark.svelte-1mbhmiv.svelte-1mbhmiv{background-color:#ff9900}anchor.svelte-1mbhmiv .multiButton button.svelte-1mbhmiv.svelte-1mbhmiv:first-child:nth-last-child(1):nth-child(1),anchor.svelte-1mbhmiv .multiButton button.svelte-1mbhmiv:first-child:nth-last-child(1)~.svelte-1mbhmiv:nth-child(1){left:25%;top:25%}anchor.svelte-1mbhmiv .multiButton button.svelte-1mbhmiv.svelte-1mbhmiv:first-child:nth-last-child(2):nth-child(1),anchor.svelte-1mbhmiv .multiButton button.svelte-1mbhmiv:first-child:nth-last-child(2)~.svelte-1mbhmiv:nth-child(1){left:37.5%;top:18.75%}anchor.svelte-1mbhmiv .multiButton button.svelte-1mbhmiv.svelte-1mbhmiv:first-child:nth-last-child(2):nth-child(2),anchor.svelte-1mbhmiv .multiButton button.svelte-1mbhmiv:first-child:nth-last-child(2)~.svelte-1mbhmiv:nth-child(2){left:18.75%;top:37.5%}anchor.svelte-1mbhmiv .multiButton button.svelte-1mbhmiv.svelte-1mbhmiv:first-child:nth-last-child(3):nth-child(1),anchor.svelte-1mbhmiv .multiButton button.svelte-1mbhmiv:first-child:nth-last-child(3)~.svelte-1mbhmiv:nth-child(1){left:50%;top:15.625%}anchor.svelte-1mbhmiv .multiButton button.svelte-1mbhmiv.svelte-1mbhmiv:first-child:nth-last-child(3):nth-child(2),anchor.svelte-1mbhmiv .multiButton button.svelte-1mbhmiv:first-child:nth-last-child(3)~.svelte-1mbhmiv:nth-child(2){left:25%;top:25%}anchor.svelte-1mbhmiv .multiButton button.svelte-1mbhmiv.svelte-1mbhmiv:first-child:nth-last-child(3):nth-child(3),anchor.svelte-1mbhmiv .multiButton button.svelte-1mbhmiv:first-child:nth-last-child(3)~.svelte-1mbhmiv:nth-child(3){left:15.625%;top:50%}anchor.svelte-1mbhmiv .multiButton button.svelte-1mbhmiv.svelte-1mbhmiv:first-child:nth-last-child(4):nth-child(1),anchor.svelte-1mbhmiv .multiButton button.svelte-1mbhmiv:first-child:nth-last-child(4)~.svelte-1mbhmiv:nth-child(1){left:62.5%;top:18.75%}anchor.svelte-1mbhmiv .multiButton button.svelte-1mbhmiv.svelte-1mbhmiv:first-child:nth-last-child(4):nth-child(2),anchor.svelte-1mbhmiv .multiButton button.svelte-1mbhmiv:first-child:nth-last-child(4)~.svelte-1mbhmiv:nth-child(2){left:37.5%;top:18.75%}anchor.svelte-1mbhmiv .multiButton button.svelte-1mbhmiv.svelte-1mbhmiv:first-child:nth-last-child(4):nth-child(3),anchor.svelte-1mbhmiv .multiButton button.svelte-1mbhmiv:first-child:nth-last-child(4)~.svelte-1mbhmiv:nth-child(3){left:18.75%;top:37.5%}anchor.svelte-1mbhmiv .multiButton button.svelte-1mbhmiv.svelte-1mbhmiv:first-child:nth-last-child(4):nth-child(4),anchor.svelte-1mbhmiv .multiButton button.svelte-1mbhmiv:first-child:nth-last-child(4)~.svelte-1mbhmiv:nth-child(4){left:18.75%;top:62.5%}anchor.svelte-1mbhmiv:hover .multiButton.svelte-1mbhmiv.svelte-1mbhmiv,anchor.svelte-1mbhmiv .multiButton.svelte-1mbhmiv.svelte-1mbhmiv:focus-within{z-index:-1;width:10rem;height:10rem;opacity:1}anchor.svelte-1mbhmiv a.svelte-1mbhmiv.svelte-1mbhmiv{color:#dddddd;text-decoration:none;font-size:13px;line-height:20px;height:100%;display:flex;flex-direction:row;justify-content:flex-start;align-items:center;flex-wrap:nowrap;align-content:flex-end}anchor.svelte-1mbhmiv:hover a.svelte-1mbhmiv.svelte-1mbhmiv{opacity:1}.titleVisible anchor.svelte-1mbhmiv a span.svelte-1mbhmiv.svelte-1mbhmiv{display:block;min-width:100px;width:auto;opacity:1;transition:width 0.6s ease, opacity 1s linear}anchor.svelte-1mbhmiv a span.svelte-1mbhmiv.svelte-1mbhmiv{display:block;width:0px;overflow:hidden;opacity:0}');
}
function create_if_block$2(ctx) {
  let anchor;
  let bgcircle;
  let t0;
  let t1;
  let a;
  let anchoricon;
  let anchoricon_transition;
  let t2;
  let t3;
  let span;
  let strong;
  let t4;
  let t5;
  let t6_value = (ctx[0] ? "\u2B50" : ctx[4] + " visits") + "";
  let t6;
  let t7;
  let anchor_intro;
  let anchor_outro;
  let current;
  let mounted;
  let dispose;
  const default_slot_template = ctx[20].default;
  const default_slot = create_slot(default_slot_template, ctx, ctx[19], null);
  let if_block0 = ctx[1] === false && create_if_block_2(ctx);
  let if_block1 = ctx[6] && create_if_block_1$1(ctx);
  return {
    c() {
      anchor = element("anchor");
      bgcircle = element("bgcircle");
      t0 = space();
      if (default_slot)
        default_slot.c();
      t1 = space();
      a = element("a");
      anchoricon = element("anchoricon");
      t2 = space();
      if (if_block0)
        if_block0.c();
      t3 = space();
      span = element("span");
      strong = element("strong");
      t4 = text(ctx[2]);
      t5 = text(" | ");
      t6 = text(t6_value);
      t7 = space();
      if (if_block1)
        if_block1.c();
      set_style(bgcircle, "transform", "scale(" + (ctx[10] * 1 + 1).toFixed(2) + ")");
      set_style(bgcircle, "background-image", "url('" + ctx[9] + "')");
      attr(bgcircle, "class", "svelte-1mbhmiv");
      set_style(anchoricon, "background-image", "url('" + (ctx[9] || "https://favicon.yandex.net/favicon/" + ctx[5]) + "')");
      attr(anchoricon, "class", "svelte-1mbhmiv");
      attr(span, "class", "svelte-1mbhmiv");
      attr(a, "ping", ctx[8]);
      attr(a, "href", ctx[3]);
      attr(a, "class", "svelte-1mbhmiv");
      attr(anchor, "title", ctx[2]);
      set_style(anchor, "margin", ctx[10] * 10 + 10 + "px");
      attr(anchor, "class", "svelte-1mbhmiv");
      toggle_class(anchor, "isBookmark", ctx[0]);
    },
    m(target, anchor$1) {
      insert(target, anchor, anchor$1);
      append(anchor, bgcircle);
      append(anchor, t0);
      if (default_slot) {
        default_slot.m(anchor, null);
      }
      append(anchor, t1);
      append(anchor, a);
      append(a, anchoricon);
      append(a, t2);
      if (if_block0)
        if_block0.m(a, null);
      append(a, t3);
      append(a, span);
      append(span, strong);
      append(strong, t4);
      append(span, t5);
      append(span, t6);
      append(anchor, t7);
      if (if_block1)
        if_block1.m(anchor, null);
      current = true;
      if (!mounted) {
        dispose = [
          listen(anchor, "contextmenu", stop_propagation(prevent_default(ctx[23]))),
          listen(anchor, "mouseleave", stop_propagation(prevent_default(ctx[24])))
        ];
        mounted = true;
      }
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      if (!current || dirty & 512) {
        set_style(bgcircle, "background-image", "url('" + ctx[9] + "')");
      }
      if (default_slot) {
        if (default_slot.p && (!current || dirty & 524288)) {
          update_slot_base(default_slot, default_slot_template, ctx, ctx[19], !current ? get_all_dirty_from_scope(ctx[19]) : get_slot_changes(default_slot_template, ctx[19], dirty, null), null);
        }
      }
      if (!current || dirty & 544) {
        set_style(anchoricon, "background-image", "url('" + (ctx[9] || "https://favicon.yandex.net/favicon/" + ctx[5]) + "')");
      }
      if (ctx[1] === false) {
        if (if_block0) {
          if_block0.p(ctx, dirty);
          if (dirty & 2) {
            transition_in(if_block0, 1);
          }
        } else {
          if_block0 = create_if_block_2(ctx);
          if_block0.c();
          transition_in(if_block0, 1);
          if_block0.m(a, t3);
        }
      } else if (if_block0) {
        group_outros();
        transition_out(if_block0, 1, 1, () => {
          if_block0 = null;
        });
        check_outros();
      }
      if (!current || dirty & 4)
        set_data(t4, ctx[2]);
      if ((!current || dirty & 17) && t6_value !== (t6_value = (ctx[0] ? "\u2B50" : ctx[4] + " visits") + ""))
        set_data(t6, t6_value);
      if (!current || dirty & 256) {
        attr(a, "ping", ctx[8]);
      }
      if (!current || dirty & 8) {
        attr(a, "href", ctx[3]);
      }
      if (ctx[6]) {
        if (if_block1) {
          if_block1.p(ctx, dirty);
          if (dirty & 64) {
            transition_in(if_block1, 1);
          }
        } else {
          if_block1 = create_if_block_1$1(ctx);
          if_block1.c();
          transition_in(if_block1, 1);
          if_block1.m(anchor, null);
        }
      } else if (if_block1) {
        group_outros();
        transition_out(if_block1, 1, 1, () => {
          if_block1 = null;
        });
        check_outros();
      }
      if (!current || dirty & 4) {
        attr(anchor, "title", ctx[2]);
      }
      if (dirty & 1) {
        toggle_class(anchor, "isBookmark", ctx[0]);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(default_slot, local);
      add_render_callback(() => {
        if (!anchoricon_transition)
          anchoricon_transition = create_bidirectional_transition(anchoricon, scale, {
            duration: 500,
            delay: 50,
            opacity: 0.5,
            start: 0.5,
            easing: quintOut
          }, true);
        anchoricon_transition.run(1);
      });
      transition_in(if_block0);
      transition_in(if_block1);
      add_render_callback(() => {
        if (anchor_outro)
          anchor_outro.end(1);
        anchor_intro = create_in_transition(anchor, scale, { duration: 330, opacity: 0.5, start: 0.5 });
        anchor_intro.start();
      });
      current = true;
    },
    o(local) {
      transition_out(default_slot, local);
      if (!anchoricon_transition)
        anchoricon_transition = create_bidirectional_transition(anchoricon, scale, {
          duration: 500,
          delay: 50,
          opacity: 0.5,
          start: 0.5,
          easing: quintOut
        }, false);
      anchoricon_transition.run(0);
      transition_out(if_block0);
      transition_out(if_block1);
      if (anchor_intro)
        anchor_intro.invalidate();
      anchor_outro = create_out_transition(anchor, fly, { x: -70, y: -20, duration: 350 });
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(anchor);
      if (default_slot)
        default_slot.d(detaching);
      if (detaching && anchoricon_transition)
        anchoricon_transition.end();
      if (if_block0)
        if_block0.d();
      if (if_block1)
        if_block1.d();
      if (detaching && anchor_outro)
        anchor_outro.end();
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block_2(ctx) {
  let anchoricon0;
  let anchoricon0_intro;
  let anchoricon0_outro;
  let t;
  let anchoricon1;
  let anchoricon1_intro;
  let anchoricon1_outro;
  let current;
  return {
    c() {
      anchoricon0 = element("anchoricon");
      t = space();
      anchoricon1 = element("anchoricon");
      attr(anchoricon0, "class", "subicon svelte-1mbhmiv");
      set_style(anchoricon0, "background-image", "url('" + ctx[9] + "')");
      attr(anchoricon1, "class", "subicon svelte-1mbhmiv");
      set_style(anchoricon1, "background-image", "url('" + ctx[9] + "')");
      set_style(anchoricon1, "transform", "scale(0.56) translate(51px, -18px)");
    },
    m(target, anchor) {
      insert(target, anchoricon0, anchor);
      insert(target, t, anchor);
      insert(target, anchoricon1, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      if (!current || dirty & 512) {
        set_style(anchoricon0, "background-image", "url('" + ctx2[9] + "')");
      }
      if (!current || dirty & 512) {
        set_style(anchoricon1, "background-image", "url('" + ctx2[9] + "')");
      }
    },
    i(local) {
      if (current)
        return;
      add_render_callback(() => {
        if (anchoricon0_outro)
          anchoricon0_outro.end(1);
        anchoricon0_intro = create_in_transition(anchoricon0, fly, { x: 95, duration: 300 });
        anchoricon0_intro.start();
      });
      add_render_callback(() => {
        if (anchoricon1_outro)
          anchoricon1_outro.end(1);
        anchoricon1_intro = create_in_transition(anchoricon1, fly, { x: 55, duration: 300 });
        anchoricon1_intro.start();
      });
      current = true;
    },
    o(local) {
      if (anchoricon0_intro)
        anchoricon0_intro.invalidate();
      anchoricon0_outro = create_out_transition(anchoricon0, fly, { x: 70, duration: 350 });
      if (anchoricon1_intro)
        anchoricon1_intro.invalidate();
      anchoricon1_outro = create_out_transition(anchoricon1, fly, { x: 50, duration: 350 });
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(anchoricon0);
      if (detaching && anchoricon0_outro)
        anchoricon0_outro.end();
      if (detaching)
        detach(t);
      if (detaching)
        detach(anchoricon1);
      if (detaching && anchoricon1_outro)
        anchoricon1_outro.end();
    }
  };
}
function create_if_block_1$1(ctx) {
  let div;
  let button0;
  let icon0;
  let t;
  let button1;
  let icon1;
  let div_intro;
  let div_outro;
  let current;
  let mounted;
  let dispose;
  icon0 = new Icon({
    props: { src: Star, solid: true, size: "22" }
  });
  icon1 = new Icon({
    props: { src: Duplicate, solid: true, size: "22" }
  });
  return {
    c() {
      div = element("div");
      button0 = element("button");
      create_component(icon0.$$.fragment);
      t = space();
      button1 = element("button");
      create_component(icon1.$$.fragment);
      attr(button0, "title", "Bookmark");
      attr(button0, "class", "svelte-1mbhmiv");
      toggle_class(button0, "isBookmark", ctx[0]);
      attr(button1, "class", "copyToBuffer svelte-1mbhmiv");
      attr(button1, "title", "Copy url");
      attr(div, "class", "svelte-1mbhmiv");
      toggle_class(div, "multiButton", ctx[6]);
    },
    m(target, anchor) {
      insert(target, div, anchor);
      append(div, button0);
      mount_component(icon0, button0, null);
      append(div, t);
      append(div, button1);
      mount_component(icon1, button1, null);
      current = true;
      if (!mounted) {
        dispose = [
          listen(button0, "click", ctx[21]),
          listen(button1, "click", ctx[22]),
          listen(div, "mouseenter", stop_propagation(prevent_default(mouseenter_handler)))
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      if (dirty & 1) {
        toggle_class(button0, "isBookmark", ctx2[0]);
      }
      if (dirty & 64) {
        toggle_class(div, "multiButton", ctx2[6]);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(icon0.$$.fragment, local);
      transition_in(icon1.$$.fragment, local);
      add_render_callback(() => {
        if (div_outro)
          div_outro.end(1);
        div_intro = create_in_transition(div, fly, { x: 5, duration: 300 });
        div_intro.start();
      });
      current = true;
    },
    o(local) {
      transition_out(icon0.$$.fragment, local);
      transition_out(icon1.$$.fragment, local);
      if (div_intro)
        div_intro.invalidate();
      div_outro = create_out_transition(div, fly, { x: 5, duration: 300 });
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(div);
      destroy_component(icon0);
      destroy_component(icon1);
      if (detaching && div_outro)
        div_outro.end();
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_fragment$4(ctx) {
  let if_block_anchor;
  let current;
  let if_block = !ctx[7] && create_if_block$2(ctx);
  return {
    c() {
      if (if_block)
        if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if (if_block)
        if_block.m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      if (!ctx2[7]) {
        if (if_block) {
          if_block.p(ctx2, dirty);
          if (dirty & 128) {
            transition_in(if_block, 1);
          }
        } else {
          if_block = create_if_block$2(ctx2);
          if_block.c();
          transition_in(if_block, 1);
          if_block.m(if_block_anchor.parentNode, if_block_anchor);
        }
      } else if (if_block) {
        group_outros();
        transition_out(if_block, 1, 1, () => {
          if_block = null;
        });
        check_outros();
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if (if_block)
        if_block.d(detaching);
      if (detaching)
        detach(if_block_anchor);
    }
  };
}
const mouseenter_handler = () => {
};
function instance$4($$self, $$props, $$invalidate) {
  let { $$slots: slots = {}, $$scope } = $$props;
  let now = new Date();
  let { dateAdded = now.getTime() } = $$props;
  let { dateGroupModified = now.getTime() } = $$props;
  let { lastVisitTime = now.getTime() } = $$props;
  let { id = 0 } = $$props;
  let { unfold = null } = $$props;
  let { index = 0 } = $$props;
  let { isBookmark = false } = $$props;
  let { title = "" } = $$props;
  let { url = "" } = $$props;
  let { visitCount = 1 } = $$props;
  let { hostVisitCount = 0 } = $$props;
  let multiButton = false;
  let deleted = false;
  localStorage.getItem("maxVisits") * 1 || 500;
  let weightVisits = Math.log10(Math.max(unfold ? visitCount : hostVisitCount, visitCount) * 1);
  let ping = "";
  try {
    let tmping = new URL(url);
    tmping.searchParams.append("utm_network", "ExpressionTab_ChromeExtension");
    ping = tmping;
  } catch (e) {
    console.log(url);
    console.log(e);
  }
  let { host = "localhost" } = $$props;
  let src = "https://s2.googleusercontent.com/s2/favicons?domain_url=" + host;
  let img_data = localStorage.getItem("favicon_" + host) || "";
  if (img_data.length > 0) {
    src = img_data;
  }
  function copyToBuffer(e, copyText) {
    return __awaiter(this, void 0, void 0, function* () {
      e.preventDefault();
      document.addEventListener("copy", function(e2) {
        e2.clipboardData.setData("text/plain", copyText);
        e2.preventDefault();
      }, true);
      document.execCommand("copy");
      console.log("copied text : ", copyText);
    });
  }
  function changeBookmark() {
    return __awaiter(this, void 0, void 0, function* () {
      if (isBookmark) {
        chrome.bookmarks.remove(String(id));
        $$invalidate(0, isBookmark = false);
      } else {
        chrome.bookmarks.create({ url, title });
        $$invalidate(0, isBookmark = true);
      }
    });
  }
  const click_handler = (e) => changeBookmark();
  const click_handler_1 = (e) => copyToBuffer(e, url);
  const contextmenu_handler = () => $$invalidate(6, multiButton = true);
  const mouseleave_handler = () => $$invalidate(6, multiButton = false);
  $$self.$$set = ($$props2) => {
    if ("dateAdded" in $$props2)
      $$invalidate(13, dateAdded = $$props2.dateAdded);
    if ("dateGroupModified" in $$props2)
      $$invalidate(14, dateGroupModified = $$props2.dateGroupModified);
    if ("lastVisitTime" in $$props2)
      $$invalidate(15, lastVisitTime = $$props2.lastVisitTime);
    if ("id" in $$props2)
      $$invalidate(16, id = $$props2.id);
    if ("unfold" in $$props2)
      $$invalidate(1, unfold = $$props2.unfold);
    if ("index" in $$props2)
      $$invalidate(17, index = $$props2.index);
    if ("isBookmark" in $$props2)
      $$invalidate(0, isBookmark = $$props2.isBookmark);
    if ("title" in $$props2)
      $$invalidate(2, title = $$props2.title);
    if ("url" in $$props2)
      $$invalidate(3, url = $$props2.url);
    if ("visitCount" in $$props2)
      $$invalidate(4, visitCount = $$props2.visitCount);
    if ("hostVisitCount" in $$props2)
      $$invalidate(18, hostVisitCount = $$props2.hostVisitCount);
    if ("host" in $$props2)
      $$invalidate(5, host = $$props2.host);
    if ("$$scope" in $$props2)
      $$invalidate(19, $$scope = $$props2.$$scope);
  };
  return [
    isBookmark,
    unfold,
    title,
    url,
    visitCount,
    host,
    multiButton,
    deleted,
    ping,
    src,
    weightVisits,
    copyToBuffer,
    changeBookmark,
    dateAdded,
    dateGroupModified,
    lastVisitTime,
    id,
    index,
    hostVisitCount,
    $$scope,
    slots,
    click_handler,
    click_handler_1,
    contextmenu_handler,
    mouseleave_handler
  ];
}
class AnchoreItem extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$4, create_fragment$4, safe_not_equal, {
      dateAdded: 13,
      dateGroupModified: 14,
      lastVisitTime: 15,
      id: 16,
      unfold: 1,
      index: 17,
      isBookmark: 0,
      title: 2,
      url: 3,
      visitCount: 4,
      hostVisitCount: 18,
      host: 5
    }, add_css$4);
  }
}
function longhover(node, duration = 1500) {
  let timer;
  const handleMouseover = () => {
    timer = setTimeout(() => {
      node.dispatchEvent(new CustomEvent("longhover"));
    }, duration);
  };
  const handleMouseout = () => {
    clearTimeout(timer);
  };
  node.addEventListener("mouseover", handleMouseover);
  node.addEventListener("mouseout", handleMouseout);
  return {
    update(newDuration) {
      duration = newDuration;
    },
    destroy() {
      node.removeEventListener("mouseover", handleMouseover);
      node.removeEventListener("mouseout", handleMouseout);
    }
  };
}
function add_css$3(target) {
  append_styles(target, "svelte-14mi8y3", 'anchorGroup.svelte-14mi8y3{width:50px;height:50px;display:flex;flex-wrap:wrap;align-content:center;justify-content:center;align-items:baseline;flex-direction:row;width:50px;height:50px;display:flex;flex-wrap:wrap;align-content:center;justify-content:center;align-items:baseline;flex-direction:row;border:20px solid #1b1b1bcf !important;filter:saturate(1.12);background-color:#6c519433;border-radius:50%;margin:30px;transition:all 1s ease}anchorGroup.svelte-14mi8y3:hover{transition:all 1s ease;border:20px solid #1d1d1df2 !important}.hovicon.svelte-14mi8y3{cursor:pointer}.hovicon.svelte-14mi8y3:after{pointer-events:none;position:absolute;width:50px;height:50px;border-radius:50%;content:"";box-sizing:content-box}.hovicon.svelte-14mi8y3:before{speak:none;display:block;-webkit-font-smoothing:antialiased}.hovicon.effect-8.svelte-14mi8y3{transition:transform ease-out 0.1s, background;transition:all ease-out 0.7s}.hovicon.effect-8.svelte-14mi8y3:after{top:0;left:0;z-index:-1;box-shadow:0 0 0 2px rgba(255, 255, 255, 0.1);opacity:0;transform:scale(0.9)}.hovicon.effect-8.svelte-14mi8y3:hover{transform:scale(0.93);background-color:#ffffffcf;transform:scale(0.93);background-color:#ffffffcf;transition:all 0.3}.hovicon.effect-8.svelte-14mi8y3:hover:after{-webkit-animation:svelte-14mi8y3-sonarEffect 1.5s cubic-bezier(0, 1.86, 0.93, -0.89) 0.5s;animation:svelte-14mi8y3-sonarEffect 1.5s cubic-bezier(0, 1.86, 0.93, -0.89) 0.5s;-webkit-animation-iteration-count:2;animation-iteration-count:2}.unfold.hovicon.effect-8.svelte-14mi8y3:hover:after{animation:svelte-14mi8y3-sonarEffect 2s ease-in 1s reverse;-webkit-animation-iteration-count:1;animation-iteration-count:1}@-webkit-keyframes svelte-14mi8y3-sonarEffect{0%{opacity:0.3}40%{opacity:0.5;box-shadow:0 0 0 2px rgba(255, 255, 255, 0.1), 0 0 10px 10px #adadad, 0 0 0 10px rgba(255, 255, 255, 0.5)}100%{box-shadow:0 0 0 2px rgba(255, 255, 255, 0.1), 0 0 10px 10px #adadad, 0 0 0 10px rgba(255, 255, 255, 0.5);transform:scale(3);opacity:0}}');
}
function get_each_context_1(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[11] = list[i];
  return child_ctx;
}
function get_each_context$1(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[11] = list[i];
  return child_ctx;
}
function create_else_block$1(ctx) {
  let anchorGroup;
  let anchoreitem;
  let anchorGroup_title_value;
  let t;
  let each_blocks = [];
  let each_1_lookup = new Map();
  let each_1_anchor;
  let current;
  let mounted;
  let dispose;
  const anchoreitem_spread_levels = [
    ctx[0],
    { host: ctx[3] },
    { unfold: ctx[2] }
  ];
  let anchoreitem_props = {};
  for (let i = 0; i < anchoreitem_spread_levels.length; i += 1) {
    anchoreitem_props = assign(anchoreitem_props, anchoreitem_spread_levels[i]);
  }
  anchoreitem = new AnchoreItem({ props: anchoreitem_props });
  let each_value_1 = ctx[1];
  const get_key = (ctx2) => ctx2[11];
  for (let i = 0; i < each_value_1.length; i += 1) {
    let child_ctx = get_each_context_1(ctx, each_value_1, i);
    let key = get_key(child_ctx);
    each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
  }
  return {
    c() {
      anchorGroup = element("anchorGroup");
      create_component(anchoreitem.$$.fragment);
      t = space();
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      each_1_anchor = empty();
      attr(anchorGroup, "class", "hovicon effect-8 svelte-14mi8y3");
      attr(anchorGroup, "title", anchorGroup_title_value = ctx[1].length);
      toggle_class(anchorGroup, "unfold", ctx[2]);
    },
    m(target, anchor) {
      insert(target, anchorGroup, anchor);
      mount_component(anchoreitem, anchorGroup, null);
      insert(target, t, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(target, anchor);
      }
      insert(target, each_1_anchor, anchor);
      current = true;
      if (!mounted) {
        dispose = [
          action_destroyer(longhover.call(null, anchorGroup, 2e3)),
          listen(anchorGroup, "longhover", stop_propagation(prevent_default(ctx[5]))),
          listen(anchorGroup, "contextmenu", ctx[7])
        ];
        mounted = true;
      }
    },
    p(ctx2, dirty) {
      const anchoreitem_changes = dirty & 13 ? get_spread_update(anchoreitem_spread_levels, [
        dirty & 1 && get_spread_object(ctx2[0]),
        dirty & 8 && { host: ctx2[3] },
        dirty & 4 && { unfold: ctx2[2] }
      ]) : {};
      anchoreitem.$set(anchoreitem_changes);
      if (!current || dirty & 2 && anchorGroup_title_value !== (anchorGroup_title_value = ctx2[1].length)) {
        attr(anchorGroup, "title", anchorGroup_title_value);
      }
      if (dirty & 4) {
        toggle_class(anchorGroup, "unfold", ctx2[2]);
      }
      if (dirty & 10) {
        each_value_1 = ctx2[1];
        group_outros();
        each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx2, each_value_1, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block_1, each_1_anchor, get_each_context_1);
        check_outros();
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(anchoreitem.$$.fragment, local);
      for (let i = 0; i < each_value_1.length; i += 1) {
        transition_in(each_blocks[i]);
      }
      current = true;
    },
    o(local) {
      transition_out(anchoreitem.$$.fragment, local);
      for (let i = 0; i < each_blocks.length; i += 1) {
        transition_out(each_blocks[i]);
      }
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(anchorGroup);
      destroy_component(anchoreitem);
      if (detaching)
        detach(t);
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].d(detaching);
      }
      if (detaching)
        detach(each_1_anchor);
      mounted = false;
      run_all(dispose);
    }
  };
}
function create_if_block$1(ctx) {
  let each_blocks = [];
  let each_1_lookup = new Map();
  let each_1_anchor;
  let current;
  let each_value = ctx[4];
  const get_key = (ctx2) => ctx2[11];
  for (let i = 0; i < each_value.length; i += 1) {
    let child_ctx = get_each_context$1(ctx, each_value, i);
    let key = get_key(child_ctx);
    each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
  }
  return {
    c() {
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      each_1_anchor = empty();
    },
    m(target, anchor) {
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(target, anchor);
      }
      insert(target, each_1_anchor, anchor);
      current = true;
    },
    p(ctx2, dirty) {
      if (dirty & 24) {
        each_value = ctx2[4];
        group_outros();
        each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx2, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block$1, each_1_anchor, get_each_context$1);
        check_outros();
      }
    },
    i(local) {
      if (current)
        return;
      for (let i = 0; i < each_value.length; i += 1) {
        transition_in(each_blocks[i]);
      }
      current = true;
    },
    o(local) {
      for (let i = 0; i < each_blocks.length; i += 1) {
        transition_out(each_blocks[i]);
      }
      current = false;
    },
    d(detaching) {
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].d(detaching);
      }
      if (detaching)
        detach(each_1_anchor);
    }
  };
}
function create_each_block_1(key_1, ctx) {
  let first;
  let anchoreitem;
  let current;
  const anchoreitem_spread_levels = [ctx[11], { host: ctx[3] }];
  let anchoreitem_props = {};
  for (let i = 0; i < anchoreitem_spread_levels.length; i += 1) {
    anchoreitem_props = assign(anchoreitem_props, anchoreitem_spread_levels[i]);
  }
  anchoreitem = new AnchoreItem({ props: anchoreitem_props });
  return {
    key: key_1,
    first: null,
    c() {
      first = empty();
      create_component(anchoreitem.$$.fragment);
      this.first = first;
    },
    m(target, anchor) {
      insert(target, first, anchor);
      mount_component(anchoreitem, target, anchor);
      current = true;
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      const anchoreitem_changes = dirty & 10 ? get_spread_update(anchoreitem_spread_levels, [
        dirty & 2 && get_spread_object(ctx[11]),
        dirty & 8 && { host: ctx[3] }
      ]) : {};
      anchoreitem.$set(anchoreitem_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(anchoreitem.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(anchoreitem.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(first);
      destroy_component(anchoreitem, detaching);
    }
  };
}
function create_each_block$1(key_1, ctx) {
  let first;
  let anchoreitem;
  let current;
  const anchoreitem_spread_levels = [ctx[11], { host: ctx[3] }];
  let anchoreitem_props = {};
  for (let i = 0; i < anchoreitem_spread_levels.length; i += 1) {
    anchoreitem_props = assign(anchoreitem_props, anchoreitem_spread_levels[i]);
  }
  anchoreitem = new AnchoreItem({ props: anchoreitem_props });
  return {
    key: key_1,
    first: null,
    c() {
      first = empty();
      create_component(anchoreitem.$$.fragment);
      this.first = first;
    },
    m(target, anchor) {
      insert(target, first, anchor);
      mount_component(anchoreitem, target, anchor);
      current = true;
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      const anchoreitem_changes = dirty & 24 ? get_spread_update(anchoreitem_spread_levels, [
        dirty & 16 && get_spread_object(ctx[11]),
        dirty & 8 && { host: ctx[3] }
      ]) : {};
      anchoreitem.$set(anchoreitem_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(anchoreitem.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(anchoreitem.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(first);
      destroy_component(anchoreitem, detaching);
    }
  };
}
function create_fragment$3(ctx) {
  let current_block_type_index;
  let if_block;
  let if_block_anchor;
  let current;
  const if_block_creators = [create_if_block$1, create_else_block$1];
  const if_blocks = [];
  function select_block_type(ctx2, dirty) {
    if (ctx2[4].length < 3)
      return 0;
    return 1;
  }
  current_block_type_index = select_block_type(ctx);
  if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  return {
    c() {
      if_block.c();
      if_block_anchor = empty();
    },
    m(target, anchor) {
      if_blocks[current_block_type_index].m(target, anchor);
      insert(target, if_block_anchor, anchor);
      current = true;
    },
    p(ctx2, [dirty]) {
      if_block.p(ctx2, dirty);
    },
    i(local) {
      if (current)
        return;
      transition_in(if_block);
      current = true;
    },
    o(local) {
      transition_out(if_block);
      current = false;
    },
    d(detaching) {
      if_blocks[current_block_type_index].d(detaching);
      if (detaching)
        detach(if_block_anchor);
    }
  };
}
function instance$3($$self, $$props, $$invalidate) {
  let { hostItem } = $$props;
  hostItem[0];
  let anchores = hostItem[1];
  let hostAnchore = anchores[0];
  let otherAnchores = anchores.slice(1);
  let tweenOtherAnchores = [];
  let unfold = false;
  function tweenAnchores() {
    return __awaiter(this, void 0, void 0, function* () {
      $$invalidate(2, unfold = !unfold);
      if (unfold == true) {
        console.log("unfold ", unfold);
        let minLenght = otherAnchores.length;
        if (otherAnchores.length > 100) {
          minLenght = Math.min(Math.floor(otherAnchores.length / 2), 50);
          console.log("minLenght = " + minLenght);
        }
        for (let i = 0; i < minLenght; i++) {
          let newItem = otherAnchores[i];
          setTimeout(function() {
            return __awaiter(this, void 0, void 0, function* () {
              yield tick();
              $$invalidate(1, tweenOtherAnchores[i] = newItem, tweenOtherAnchores);
            });
          }, 350);
        }
        if (otherAnchores.length > 100) {
          setTimeout(function() {
            return __awaiter(this, void 0, void 0, function* () {
              yield tick();
              $$invalidate(1, tweenOtherAnchores = otherAnchores);
            });
          }, 350);
        }
        console.log("minLengh = " + minLenght);
      } else {
        console.log("unfold ", unfold);
        $$invalidate(1, tweenOtherAnchores = tweenOtherAnchores.slice(0, Math.min(Math.floor(tweenOtherAnchores.length / 3), 100)));
        for (let j = 0; j < tweenOtherAnchores.length; j++) {
          setTimeout(function(j2) {
            return __awaiter(this, void 0, void 0, function* () {
              yield tick();
              tweenOtherAnchores.pop();
              $$invalidate(1, tweenOtherAnchores);
            });
          }, 300);
        }
      }
      $$invalidate(0, hostAnchore);
    });
  }
  let host = "localhost";
  try {
    host = new URL(hostAnchore.url).host.split(":")[0];
    setTimeout(function() {
      let fav = localStorage.getItem("favicon_" + host);
      if (!(fav === null || fav === void 0 ? void 0 : fav.length)) {
        toDataURL2("https://s2.googleusercontent.com/s2/favicons?domain_url=" + hostAnchore.url, (dataUrl) => {
          localStorage.setItem("favicon_" + host, dataUrl);
          console.log("new favicon saved from ", host);
        });
      }
    }, 1e4);
  } catch (e) {
    console.log("No favicon for url: ", hostAnchore.url, hostAnchore.title);
  }
  function toDataURL2(urll, callback) {
    return __awaiter(this, void 0, void 0, function* () {
      var xhr = new XMLHttpRequest();
      xhr.onload = function() {
        var reader = new FileReader();
        reader.onloadend = function() {
          callback(reader.result);
        };
        reader.readAsDataURL(xhr.response);
      };
      xhr.open("GET", urll);
      xhr.responseType = "blob";
      xhr.send();
    });
  }
  const contextmenu_handler = () => $$invalidate(2, unfold = true);
  $$self.$$set = ($$props2) => {
    if ("hostItem" in $$props2)
      $$invalidate(6, hostItem = $$props2.hostItem);
  };
  return [
    hostAnchore,
    tweenOtherAnchores,
    unfold,
    host,
    anchores,
    tweenAnchores,
    hostItem,
    contextmenu_handler
  ];
}
class HostItem extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$3, create_fragment$3, safe_not_equal, { hostItem: 6 }, add_css$3);
  }
}
const { Map: Map_1, clearTimeout: clearTimeout_1, setTimeout: setTimeout_1, window: window_1 } = globals;
function add_css$2(target) {
  append_styles(target, "svelte-ijgerc", 'loader.svelte-ijgerc.svelte-ijgerc{clear:left}#search.svelte-ijgerc.svelte-ijgerc{background:rgba(2, 2, 2, 0.2);border:0px;border-bottom:2px solid #141414;height:30px}#changeView.svelte-ijgerc input.svelte-ijgerc{opacity:0;display:none}.text-white.svelte-ijgerc.svelte-ijgerc{color:#fff}filterBar.svelte-ijgerc.svelte-ijgerc{background:#141414;display:flex;position:relative;height:80px;flex-direction:row;flex-wrap:wrap;align-content:space-around;justify-content:flex-start;align-items:center;gap:10px;padding:0 32px}filterBar.svelte-ijgerc .svelte-ijgerc{opacity:0;transition:opacity 0.3s ease}main:hover filterBar.svelte-ijgerc .svelte-ijgerc{opacity:1;transition:opacity 0.3s ease 2s}anchores.svelte-ijgerc.svelte-ijgerc{display:flex;flex-wrap:wrap;flex-direction:row;align-content:flex-end;align-items:center;position:relative;width:100%;height:auto;padding-top:10px;z-index:1;background:#141414;justify-content:flex-start}anchores.svelte-ijgerc.svelte-ijgerc:after{height:100px;display:block;position:absolute;left:0;content:"";background:linear-gradient(0deg, rgba(20, 20, 20, 0), #141414)}.lds-circle.svelte-ijgerc.svelte-ijgerc{display:inline-block;transform:translateZ(1px)}.lds-circle.svelte-ijgerc>div.svelte-ijgerc{display:inline-block;width:40px;height:40px;margin:8px;border-radius:50%;background:#fff;-webkit-animation:svelte-ijgerc-lds-circle 2.4s cubic-bezier(0, 0.2, 0.8, 1) infinite;animation:svelte-ijgerc-lds-circle 2.4s cubic-bezier(0, 0.2, 0.8, 1) infinite}@-webkit-keyframes svelte-ijgerc-lds-circle{0%,100%{-webkit-animation-timing-function:cubic-bezier(0.5, 0, 1, 0.5);animation-timing-function:cubic-bezier(0.5, 0, 1, 0.5)}0%{transform:rotateY(0deg)}50%{transform:rotateY(1800deg);-webkit-animation-timing-function:cubic-bezier(0, 0.5, 0.5, 1);animation-timing-function:cubic-bezier(0, 0.5, 0.5, 1)}100%{transform:rotateY(3600deg)}}@keyframes svelte-ijgerc-lds-circle{0%,100%{-webkit-animation-timing-function:cubic-bezier(0.5, 0, 1, 0.5);animation-timing-function:cubic-bezier(0.5, 0, 1, 0.5)}0%{transform:rotateY(0deg)}50%{transform:rotateY(1800deg);-webkit-animation-timing-function:cubic-bezier(0, 0.5, 0.5, 1);animation-timing-function:cubic-bezier(0, 0.5, 0.5, 1)}100%{transform:rotateY(3600deg)}}.titleVisible.svelte-ijgerc.svelte-ijgerc{flex-direction:row;flex-wrap:wrap}.titleVisible.svelte-ijgerc anchor{width:100% !important;padding:10px !important;margin:10px !important;border:1px solid transparent !important;transform:scale(1) !important;-webkit-animation:-global-width-grow-anchor 1s cubic-bezier(0.455, 0.03, 0.515, 0.955) both;animation:-global-width-grow-anchor 1s cubic-bezier(0.455, 0.03, 0.515, 0.955) both}.titleVisible.svelte-ijgerc anchor:nth-child(-n + 10){transition:transform cubic-bezier(0.23, 1, 0.32, 1), width 0.5s ease}@-webkit-keyframes width-grow-anchor{0%{width:50px}100%{width:auto}}@keyframes width-grow-anchor{0%{width:50px}100%{width:auto}}');
}
function get_each_context(ctx, list, i) {
  const child_ctx = ctx.slice();
  child_ctx[24] = list[i];
  return child_ctx;
}
function create_else_block(ctx) {
  let line0;
  let line0_transition;
  let line1;
  let line1_transition;
  let line2;
  let line2_transition;
  let line3;
  let line4;
  let line5;
  let current;
  return {
    c() {
      line0 = svg_element("line");
      line1 = svg_element("line");
      line2 = svg_element("line");
      line3 = svg_element("line");
      line4 = svg_element("line");
      line5 = svg_element("line");
      attr(line0, "x1", "8");
      attr(line0, "y1", "6");
      attr(line0, "x2", "21");
      attr(line0, "y2", "6");
      attr(line0, "class", "svelte-ijgerc");
      attr(line1, "x1", "8");
      attr(line1, "y1", "12");
      attr(line1, "x2", "21");
      attr(line1, "y2", "12");
      attr(line1, "class", "svelte-ijgerc");
      attr(line2, "x1", "8");
      attr(line2, "y1", "18");
      attr(line2, "x2", "21");
      attr(line2, "y2", "18");
      attr(line2, "class", "svelte-ijgerc");
      attr(line3, "x1", "3");
      attr(line3, "y1", "6");
      attr(line3, "x2", "3.01");
      attr(line3, "y2", "6");
      attr(line3, "class", "svelte-ijgerc");
      attr(line4, "x1", "3");
      attr(line4, "y1", "12");
      attr(line4, "x2", "3.01");
      attr(line4, "y2", "12");
      attr(line4, "class", "svelte-ijgerc");
      attr(line5, "x1", "3");
      attr(line5, "y1", "18");
      attr(line5, "x2", "3.01");
      attr(line5, "y2", "18");
      attr(line5, "class", "svelte-ijgerc");
    },
    m(target, anchor) {
      insert(target, line0, anchor);
      insert(target, line1, anchor);
      insert(target, line2, anchor);
      insert(target, line3, anchor);
      insert(target, line4, anchor);
      insert(target, line5, anchor);
      current = true;
    },
    p(new_ctx, dirty) {
    },
    i(local) {
      if (current)
        return;
      add_render_callback(() => {
        if (!line0_transition)
          line0_transition = create_bidirectional_transition(line0, draw, {
            duration: 300,
            delay: 100,
            easing: cubicOut
          }, true);
        line0_transition.run(1);
      });
      add_render_callback(() => {
        if (!line1_transition)
          line1_transition = create_bidirectional_transition(line1, draw, {
            duration: 300,
            delay: 200,
            easing: quintOut
          }, true);
        line1_transition.run(1);
      });
      add_render_callback(() => {
        if (!line2_transition)
          line2_transition = create_bidirectional_transition(line2, draw, {
            duration: 400,
            delay: 200,
            easing: cubicOut
          }, true);
        line2_transition.run(1);
      });
      current = true;
    },
    o(local) {
      if (!line0_transition)
        line0_transition = create_bidirectional_transition(line0, draw, {
          duration: 300,
          delay: 100,
          easing: cubicOut
        }, false);
      line0_transition.run(0);
      if (!line1_transition)
        line1_transition = create_bidirectional_transition(line1, draw, {
          duration: 300,
          delay: 200,
          easing: quintOut
        }, false);
      line1_transition.run(0);
      if (!line2_transition)
        line2_transition = create_bidirectional_transition(line2, draw, {
          duration: 400,
          delay: 200,
          easing: cubicOut
        }, false);
      line2_transition.run(0);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(line0);
      if (detaching && line0_transition)
        line0_transition.end();
      if (detaching)
        detach(line1);
      if (detaching && line1_transition)
        line1_transition.end();
      if (detaching)
        detach(line2);
      if (detaching && line2_transition)
        line2_transition.end();
      if (detaching)
        detach(line3);
      if (detaching)
        detach(line4);
      if (detaching)
        detach(line5);
    }
  };
}
function create_if_block_1(ctx) {
  let circle0;
  let circle0_transition;
  let circle1;
  let circle1_transition;
  let rect;
  let rect_transition;
  let current;
  return {
    c() {
      circle0 = svg_element("circle");
      circle1 = svg_element("circle");
      rect = svg_element("rect");
      attr(circle0, "cx", "12");
      attr(circle0, "cy", "12");
      attr(circle0, "r", "10");
      attr(circle0, "class", "svelte-ijgerc");
      attr(circle1, "cx", "12");
      attr(circle1, "cy", "12");
      attr(circle1, "r", "2");
      attr(circle1, "class", "svelte-ijgerc");
      attr(rect, "x", "6");
      attr(rect, "y", "6");
      attr(rect, "width", "12");
      attr(rect, "height", "12");
      attr(rect, "class", "svelte-ijgerc");
    },
    m(target, anchor) {
      insert(target, circle0, anchor);
      insert(target, circle1, anchor);
      insert(target, rect, anchor);
      current = true;
    },
    p(new_ctx, dirty) {
    },
    i(local) {
      if (current)
        return;
      add_render_callback(() => {
        if (!circle0_transition)
          circle0_transition = create_bidirectional_transition(circle0, draw, {
            duration: 500,
            delay: 0,
            easing: cubicOut
          }, true);
        circle0_transition.run(1);
      });
      add_render_callback(() => {
        if (!circle1_transition)
          circle1_transition = create_bidirectional_transition(circle1, draw, {
            duration: 200,
            delay: 200,
            easing: cubicOut
          }, true);
        circle1_transition.run(1);
      });
      add_render_callback(() => {
        if (!rect_transition)
          rect_transition = create_bidirectional_transition(rect, draw, {
            duration: 100,
            delay: 0,
            easing: cubicOut
          }, true);
        rect_transition.run(1);
      });
      current = true;
    },
    o(local) {
      if (!circle0_transition)
        circle0_transition = create_bidirectional_transition(circle0, draw, {
          duration: 500,
          delay: 0,
          easing: cubicOut
        }, false);
      circle0_transition.run(0);
      if (!circle1_transition)
        circle1_transition = create_bidirectional_transition(circle1, draw, {
          duration: 200,
          delay: 200,
          easing: cubicOut
        }, false);
      circle1_transition.run(0);
      if (!rect_transition)
        rect_transition = create_bidirectional_transition(rect, draw, {
          duration: 100,
          delay: 0,
          easing: cubicOut
        }, false);
      rect_transition.run(0);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(circle0);
      if (detaching && circle0_transition)
        circle0_transition.end();
      if (detaching)
        detach(circle1);
      if (detaching && circle1_transition)
        circle1_transition.end();
      if (detaching)
        detach(rect);
      if (detaching && rect_transition)
        rect_transition.end();
    }
  };
}
function create_each_block(key_1, ctx) {
  let first;
  let hostitem;
  let current;
  hostitem = new HostItem({
    props: { hostItem: ctx[24] }
  });
  return {
    key: key_1,
    first: null,
    c() {
      first = empty();
      create_component(hostitem.$$.fragment);
      this.first = first;
    },
    m(target, anchor) {
      insert(target, first, anchor);
      mount_component(hostitem, target, anchor);
      current = true;
    },
    p(new_ctx, dirty) {
      ctx = new_ctx;
      const hostitem_changes = {};
      if (dirty & 4)
        hostitem_changes.hostItem = ctx[24];
      hostitem.$set(hostitem_changes);
    },
    i(local) {
      if (current)
        return;
      transition_in(hostitem.$$.fragment, local);
      current = true;
    },
    o(local) {
      transition_out(hostitem.$$.fragment, local);
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(first);
      destroy_component(hostitem, detaching);
    }
  };
}
function create_if_block(ctx) {
  let loader_1;
  return {
    c() {
      loader_1 = element("loader");
      loader_1.innerHTML = `<div class="lds-circle svelte-ijgerc"><div class="svelte-ijgerc"></div></div>`;
      attr(loader_1, "class", "svelte-ijgerc");
    },
    m(target, anchor) {
      insert(target, loader_1, anchor);
    },
    d(detaching) {
      if (detaching)
        detach(loader_1);
    }
  };
}
function create_fragment$2(ctx) {
  let scrolling = false;
  let clear_scrolling = () => {
    scrolling = false;
  };
  let scrolling_timeout;
  let filterBar;
  let input0;
  let t0;
  let label;
  let input1;
  let t1;
  let icon;
  let svg;
  let current_block_type_index;
  let if_block0;
  let t2;
  let span;
  let t3;
  let t4;
  let t5;
  let t6;
  let t7;
  let t8;
  let t9_value = (ctx[0].length || 1) + "";
  let t9;
  let t10;
  let t11_value = (ctx[0].length > 1 ? "s" : "") + "";
  let t11;
  let t12;
  let t13;
  let anchores;
  let each_blocks = [];
  let each_1_lookup = new Map_1();
  let t14;
  let anchores_resize_listener;
  let current;
  let mounted;
  let dispose;
  add_render_callback(ctx[13]);
  add_render_callback(ctx[14]);
  const if_block_creators = [create_if_block_1, create_else_block];
  const if_blocks = [];
  function select_block_type(ctx2, dirty) {
    if (ctx2[1])
      return 0;
    return 1;
  }
  current_block_type_index = select_block_type(ctx);
  if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
  let each_value = ctx[2];
  const get_key = (ctx2) => ctx2[24];
  for (let i = 0; i < each_value.length; i += 1) {
    let child_ctx = get_each_context(ctx, each_value, i);
    let key = get_key(child_ctx);
    each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
  }
  let if_block1 = ctx[4] && create_if_block();
  return {
    c() {
      filterBar = element("filterBar");
      input0 = element("input");
      t0 = space();
      label = element("label");
      input1 = element("input");
      t1 = space();
      icon = element("icon");
      svg = svg_element("svg");
      if_block0.c();
      t2 = space();
      span = element("span");
      t3 = text(ctx[0]);
      t4 = text("\r\n      showing items ");
      t5 = text(ctx[8]);
      t6 = text("\r\n      of ");
      t7 = text(ctx[3]);
      t8 = text(", last ");
      t9 = text(t9_value);
      t10 = text(" week");
      t11 = text(t11_value);
      t12 = text(",");
      t13 = space();
      anchores = element("anchores");
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].c();
      }
      t14 = space();
      if (if_block1)
        if_block1.c();
      attr(input0, "class", "text-white svelte-ijgerc");
      attr(input0, "type", "search");
      attr(input0, "id", "search");
      attr(input1, "type", "checkbox");
      attr(input1, "class", "svelte-ijgerc");
      attr(svg, "xmlns", "http://www.w3.org/2000/svg");
      attr(svg, "width", "24");
      attr(svg, "height", "24");
      attr(svg, "viewBox", "0 0 24 24");
      attr(svg, "fill", "none");
      attr(svg, "stroke", "currentColor");
      attr(svg, "stroke-width", "2");
      attr(svg, "stroke-linecap", "round");
      attr(svg, "stroke-linejoin", "round");
      attr(svg, "class", "feather feather-stop-circle svelte-ijgerc");
      attr(icon, "class", "svelte-ijgerc");
      attr(label, "id", "changeView");
      attr(label, "class", "svelte-ijgerc");
      attr(span, "class", "svelte-ijgerc");
      attr(filterBar, "class", "text-white svelte-ijgerc");
      attr(anchores, "class", "svelte-ijgerc");
      add_render_callback(() => ctx[17].call(anchores));
      toggle_class(anchores, "titleVisible", ctx[1]);
    },
    m(target, anchor) {
      insert(target, filterBar, anchor);
      append(filterBar, input0);
      set_input_value(input0, ctx[0]);
      append(filterBar, t0);
      append(filterBar, label);
      append(label, input1);
      input1.checked = ctx[1];
      append(label, t1);
      append(label, icon);
      append(icon, svg);
      if_blocks[current_block_type_index].m(svg, null);
      append(filterBar, t2);
      append(filterBar, span);
      append(span, t3);
      append(span, t4);
      append(span, t5);
      append(span, t6);
      append(span, t7);
      append(span, t8);
      append(span, t9);
      append(span, t10);
      append(span, t11);
      append(span, t12);
      insert(target, t13, anchor);
      insert(target, anchores, anchor);
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].m(anchores, null);
      }
      append(anchores, t14);
      if (if_block1)
        if_block1.m(anchores, null);
      anchores_resize_listener = add_resize_listener(anchores, ctx[17].bind(anchores));
      current = true;
      if (!mounted) {
        dispose = [
          listen(window_1, "scroll", ctx[11](false)),
          listen(window_1, "scroll", () => {
            scrolling = true;
            clearTimeout_1(scrolling_timeout);
            scrolling_timeout = setTimeout_1(clear_scrolling, 100);
            ctx[13]();
          }),
          listen(window_1, "resize", ctx[14]),
          listen(input0, "input", ctx[15]),
          listen(input1, "change", ctx[16])
        ];
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (dirty & 32 && !scrolling) {
        scrolling = true;
        clearTimeout_1(scrolling_timeout);
        scrollTo(window_1.pageXOffset, ctx2[5]);
        scrolling_timeout = setTimeout_1(clear_scrolling, 100);
      }
      if (dirty & 1) {
        set_input_value(input0, ctx2[0]);
      }
      if (dirty & 2) {
        input1.checked = ctx2[1];
      }
      let previous_block_index = current_block_type_index;
      current_block_type_index = select_block_type(ctx2);
      if (current_block_type_index === previous_block_index) {
        if_blocks[current_block_type_index].p(ctx2, dirty);
      } else {
        group_outros();
        transition_out(if_blocks[previous_block_index], 1, 1, () => {
          if_blocks[previous_block_index] = null;
        });
        check_outros();
        if_block0 = if_blocks[current_block_type_index];
        if (!if_block0) {
          if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx2);
          if_block0.c();
        } else {
          if_block0.p(ctx2, dirty);
        }
        transition_in(if_block0, 1);
        if_block0.m(svg, null);
      }
      if (!current || dirty & 1)
        set_data(t3, ctx2[0]);
      if (!current || dirty & 256)
        set_data(t5, ctx2[8]);
      if (!current || dirty & 8)
        set_data(t7, ctx2[3]);
      if ((!current || dirty & 1) && t9_value !== (t9_value = (ctx2[0].length || 1) + ""))
        set_data(t9, t9_value);
      if ((!current || dirty & 1) && t11_value !== (t11_value = (ctx2[0].length > 1 ? "s" : "") + ""))
        set_data(t11, t11_value);
      if (dirty & 4) {
        each_value = ctx2[2];
        group_outros();
        each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx2, each_value, each_1_lookup, anchores, outro_and_destroy_block, create_each_block, t14, get_each_context);
        check_outros();
      }
      if (ctx2[4]) {
        if (if_block1)
          ;
        else {
          if_block1 = create_if_block();
          if_block1.c();
          if_block1.m(anchores, null);
        }
      } else if (if_block1) {
        if_block1.d(1);
        if_block1 = null;
      }
      if (dirty & 2) {
        toggle_class(anchores, "titleVisible", ctx2[1]);
      }
    },
    i(local) {
      if (current)
        return;
      transition_in(if_block0);
      for (let i = 0; i < each_value.length; i += 1) {
        transition_in(each_blocks[i]);
      }
      current = true;
    },
    o(local) {
      transition_out(if_block0);
      for (let i = 0; i < each_blocks.length; i += 1) {
        transition_out(each_blocks[i]);
      }
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(filterBar);
      if_blocks[current_block_type_index].d();
      if (detaching)
        detach(t13);
      if (detaching)
        detach(anchores);
      for (let i = 0; i < each_blocks.length; i += 1) {
        each_blocks[i].d();
      }
      if (if_block1)
        if_block1.d();
      anchores_resize_listener();
      mounted = false;
      run_all(dispose);
    }
  };
}
function instance$2($$self, $$props, $$invalidate) {
  let searchTerm = localStorage.getItem("searchTerm") || "";
  let bookmarkList = new Map(), filteredListSliced = [], bookmarkListSize = 0, loader = false, titleVisible = false, windowY = 0, hh = 0, ww = 0, visible = Math.ceil(hh * ww / 50 / 50) || 200, windowHeight = 0, windowWidth = 0;
  function getBookmarks() {
    return __awaiter(this, void 0, void 0, function* () {
      console.log("get bookm searchTerm");
      console.log(searchTerm);
      const promise = Promise.all([
        new Promise((resolve) => {
          chrome.history.search({
            text: searchTerm,
            startTime: new Date().getTime() - 1e3 * 60 * 60 * 24 * 7 * (searchTerm.length + 1),
            maxResults: 2e3
          }, (results) => {
            return resolve(results);
          });
        }),
        chrome.bookmarks.search(searchTerm || "h")
      ]);
      const s = yield promise;
      console.log("s bookmarks");
      console.log(s);
      let a = s[0];
      let b = s[1];
      let arr1Length = a.length;
      let arr2Length = b.length;
      a.length = arr1Length + arr2Length;
      for (let i = 0; i < arr2Length; i++) {
        a[arr1Length + i] = b[i];
        a[arr1Length + i].isBookmark = true;
      }
      b = [];
      arr1Length = a.length;
      bookmarkList = new Map();
      let maxVisits = 1;
      for (let i = 0; i < arr1Length; i++) {
        let host = "localhost";
        try {
          host = new URL(a[i].url).host.split(":")[0];
          if (bookmarkList.has(host)) {
            let bmitems = bookmarkList.get(host);
            bmitems[0].hostVisitCount = bmitems[0].hostVisitCount * 1 + (a[i].visitCount || 1);
            maxVisits = Math.max(maxVisits, bmitems[0].hostVisitCount);
            bookmarkList.set(host, [...bmitems, a[i]]);
          } else {
            a[i].hostVisitCount = a[i].visitCount || 1;
            bookmarkList.set(host, [a[i]]);
          }
        } catch (e) {
          console.log(e);
          console.log("No favicon for url: ", a[i].url, a[i].title);
        }
      }
      $$invalidate(3, bookmarkListSize = bookmarkList.size);
      console.log("bookmarkList ready");
      localStorage.setItem("maxVisits", maxVisits + "");
      loadmore(true);
    });
  }
  let timer;
  function loadmore(force = false) {
    return __awaiter(this, void 0, void 0, function* () {
      let pixel_offset = 200;
      if ((force || window.innerHeight + window.scrollY >= document.body.offsetHeight - pixel_offset || visible != bookmarkList.size) && loader == false) {
        console.log("loadmore render");
        $$invalidate(4, loader = true);
        let nowvisible = Math.ceil(hh * ww / 50 / 50);
        let incrementVisible = 100;
        console.log("old visible", visible);
        $$invalidate(8, visible = Math.abs(Math.min(nowvisible + incrementVisible, bookmarkList.size)));
        console.log("new visible", visible);
        yield tick();
        $$invalidate(2, filteredListSliced = Array.from(bookmarkList).slice(0, visible));
        yield tick();
        $$invalidate(4, loader = false);
      }
    });
  }
  onMount(() => {
  });
  onDestroy(() => {
    localStorage.setItem("maxVisits", "0");
  });
  function onwindowscroll() {
    $$invalidate(5, windowY = window_1.pageYOffset);
  }
  function onwindowresize() {
    $$invalidate(9, windowHeight = window_1.innerHeight);
    $$invalidate(10, windowWidth = window_1.innerWidth);
  }
  function input0_input_handler() {
    searchTerm = this.value;
    $$invalidate(0, searchTerm);
  }
  function input1_change_handler() {
    titleVisible = this.checked;
    $$invalidate(1, titleVisible);
  }
  function anchores_elementresize_handler() {
    hh = this.clientHeight;
    ww = this.clientWidth;
    $$invalidate(6, hh);
    $$invalidate(7, ww);
  }
  $$self.$$.update = () => {
    if ($$self.$$.dirty & 4097) {
      {
        clearTimeout(timer);
        $$invalidate(12, timer = setTimeout(() => {
          localStorage.setItem("searchTerm", searchTerm);
          console.log("searchTerm save");
          getBookmarks();
        }, 750));
      }
    }
    if ($$self.$$.dirty & 2) {
      if (titleVisible) {
        $$invalidate(8, visible = 20);
      } else {
        $$invalidate(8, visible = 300);
      }
    }
  };
  return [
    searchTerm,
    titleVisible,
    filteredListSliced,
    bookmarkListSize,
    loader,
    windowY,
    hh,
    ww,
    visible,
    windowHeight,
    windowWidth,
    loadmore,
    timer,
    onwindowscroll,
    onwindowresize,
    input0_input_handler,
    input1_change_handler,
    anchores_elementresize_handler
  ];
}
class Anchores extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$2, create_fragment$2, safe_not_equal, {}, add_css$2);
  }
}
function add_css$1(target) {
  append_styles(target, "svelte-z7qah6", "clock-and-greeting.svelte-z7qah6.svelte-z7qah6{height:75%;flex-direction:column;font-family:Lato, sans-serif}clock-and-greeting.svelte-z7qah6.svelte-z7qah6{display:flex;justify-content:center}time-display.svelte-z7qah6.svelte-z7qah6{display:flex;justify-content:center;font-weight:300;color:#fff;font-size:12vw}time-display.svelte-z7qah6.svelte-z7qah6,time-display.svelte-z7qah6 p.svelte-z7qah6{padding:0;margin:0;text-shadow:0 0 50px #0000009d}time-display.svelte-z7qah6 p.svelte-z7qah6:hover{transition:all 0.3s ease}time-display.svelte-z7qah6 p span.svelte-z7qah6{width:1.5em;display:inline-block;transition:all 0.3s ease}");
}
function create_key_block_2(ctx) {
  let span;
  let t;
  let span_intro;
  return {
    c() {
      span = element("span");
      t = text(ctx[1]);
      attr(span, "class", "svelte-z7qah6");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t);
    },
    p(ctx2, dirty) {
      if (dirty & 2)
        set_data(t, ctx2[1]);
    },
    i(local) {
      if (!span_intro) {
        add_render_callback(() => {
          span_intro = create_in_transition(span, fly, { y: -20 });
          span_intro.start();
        });
      }
    },
    o: noop,
    d(detaching) {
      if (detaching)
        detach(span);
    }
  };
}
function create_key_block_1(ctx) {
  let span;
  let t;
  let span_intro;
  return {
    c() {
      span = element("span");
      t = text(ctx[2]);
      attr(span, "class", "svelte-z7qah6");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t);
    },
    p(ctx2, dirty) {
      if (dirty & 4)
        set_data(t, ctx2[2]);
    },
    i(local) {
      if (!span_intro) {
        add_render_callback(() => {
          span_intro = create_in_transition(span, fly, { y: -20 });
          span_intro.start();
        });
      }
    },
    o: noop,
    d(detaching) {
      if (detaching)
        detach(span);
    }
  };
}
function create_key_block(ctx) {
  let span;
  let t;
  let span_intro;
  return {
    c() {
      span = element("span");
      t = text(ctx[3]);
      attr(span, "class", "svelte-z7qah6");
    },
    m(target, anchor) {
      insert(target, span, anchor);
      append(span, t);
    },
    p(ctx2, dirty) {
      if (dirty & 8)
        set_data(t, ctx2[3]);
    },
    i(local) {
      if (!span_intro) {
        add_render_callback(() => {
          span_intro = create_in_transition(span, fly, { y: -20 });
          span_intro.start();
        });
      }
    },
    o: noop,
    d(detaching) {
      if (detaching)
        detach(span);
    }
  };
}
function create_fragment$1(ctx) {
  let clock_and_greeting;
  let time_display;
  let p;
  let previous_key = ctx[1];
  let t0;
  let previous_key_1 = ctx[2];
  let t1;
  let previous_key_2 = ctx[3];
  let mounted;
  let dispose;
  let key_block0 = create_key_block_2(ctx);
  let key_block1 = create_key_block_1(ctx);
  let key_block2 = create_key_block(ctx);
  return {
    c() {
      clock_and_greeting = element("clock-and-greeting");
      time_display = element("time-display");
      p = element("p");
      key_block0.c();
      t0 = text(":\r\n            ");
      key_block1.c();
      t1 = text(":\r\n            ");
      key_block2.c();
      attr(p, "class", "svelte-z7qah6");
      set_custom_element_data(time_display, "class", "svelte-z7qah6");
      set_custom_element_data(clock_and_greeting, "class", "svelte-z7qah6");
    },
    m(target, anchor) {
      insert(target, clock_and_greeting, anchor);
      append(clock_and_greeting, time_display);
      append(time_display, p);
      key_block0.m(p, null);
      append(p, t0);
      key_block1.m(p, null);
      append(p, t1);
      key_block2.m(p, null);
      if (!mounted) {
        dispose = listen(time_display, "click", ctx[5]);
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (dirty & 2 && safe_not_equal(previous_key, previous_key = ctx2[1])) {
        group_outros();
        transition_out(key_block0, 1, 1, noop);
        check_outros();
        key_block0 = create_key_block_2(ctx2);
        key_block0.c();
        transition_in(key_block0);
        key_block0.m(p, t0);
      } else {
        key_block0.p(ctx2, dirty);
      }
      if (dirty & 4 && safe_not_equal(previous_key_1, previous_key_1 = ctx2[2])) {
        group_outros();
        transition_out(key_block1, 1, 1, noop);
        check_outros();
        key_block1 = create_key_block_1(ctx2);
        key_block1.c();
        transition_in(key_block1);
        key_block1.m(p, t1);
      } else {
        key_block1.p(ctx2, dirty);
      }
      if (dirty & 8 && safe_not_equal(previous_key_2, previous_key_2 = ctx2[3])) {
        group_outros();
        transition_out(key_block2, 1, 1, noop);
        check_outros();
        key_block2 = create_key_block(ctx2);
        key_block2.c();
        transition_in(key_block2);
        key_block2.m(p, null);
      } else {
        key_block2.p(ctx2, dirty);
      }
    },
    i(local) {
      transition_in(key_block0);
      transition_in(key_block1);
      transition_in(key_block2);
    },
    o(local) {
      transition_out(key_block0);
      transition_out(key_block1);
      transition_out(key_block2);
    },
    d(detaching) {
      if (detaching)
        detach(clock_and_greeting);
      key_block0.d(detaching);
      key_block1.d(detaching);
      key_block2.d(detaching);
      mounted = false;
      dispose();
    }
  };
}
function instance$1($$self, $$props, $$invalidate) {
  let timerType = 0;
  let hour = "";
  let min = "";
  let sec = "";
  let date = new Date();
  let interval;
  onMount(() => {
    interval = setInterval(() => {
      $$invalidate(4, date = new Date());
    }, 1e3);
  });
  onDestroy(() => {
    clearInterval(interval);
  });
  const click_handler = () => {
    timerType + 1 > 1 ? $$invalidate(0, timerType = 0) : $$invalidate(0, timerType++, timerType);
  };
  $$self.$$.update = () => {
    if ($$self.$$.dirty & 17) {
      switch (timerType) {
        case 0:
          $$invalidate(1, hour = ("0" + (23 - date.getHours())).slice(-2));
          $$invalidate(2, min = ("0" + (59 - date.getMinutes())).slice(-2));
          $$invalidate(3, sec = ("0" + (59 - date.getSeconds())).slice(-2));
          break;
        case 1:
          $$invalidate(1, hour = ("0" + date.getHours()).slice(-2));
          $$invalidate(2, min = ("0" + date.getMinutes()).slice(-2));
          $$invalidate(3, sec = ("0" + date.getSeconds()).slice(-2));
          break;
      }
    }
  };
  return [timerType, hour, min, sec, date, click_handler];
}
class Timer extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance$1, create_fragment$1, safe_not_equal, {}, add_css$1);
  }
}
function add_css(target) {
  append_styles(target, "svelte-12m8nlp", '.svelte-12m8nlp{--brand-color:rgba(255, 255, 255, 1)}:root{font-family:"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif}main.svelte-12m8nlp{text-align:center;margin:0 auto;min-height:100vh;transition:all 0.5s ease;font-weight:300}spacer.svelte-12m8nlp{background:linear-gradient(180deg, rgba(20, 20, 20, 0), #141414);height:92vh;transition:height 0.3s ease-in-out 1s;display:flex;width:100%;position:relative;flex-direction:row;flex-wrap:nowrap;align-content:space-around;justify-content:space-around;align-items:center}bg.svelte-12m8nlp{background-color:#222;background-repeat:no-repeat;background-size:cover;background-position:center;position:fixed;left:0;top:0;width:100%;min-height:100vh;z-index:-2;transition:all 0.3s ease}overlay.svelte-12m8nlp{position:fixed;top:0;right:0;left:0;bottom:0;overflow:hidden;background:linear-gradient(180deg, rgba(0, 0, 0, 0.25) 0, rgba(0, 0, 0, 0.25));z-index:-1}');
}
function create_fragment(ctx) {
  let main;
  let bg_1;
  let bg_1_intro;
  let bg_1_outro;
  let t0;
  let overlay;
  let overlay_intro;
  let overlay_outro;
  let t1;
  let spacer;
  let timer;
  let t2;
  let anchores;
  let main_intro;
  let main_outro;
  let current;
  let mounted;
  let dispose;
  timer = new Timer({});
  anchores = new Anchores({});
  return {
    c() {
      main = element("main");
      bg_1 = element("bg");
      t0 = space();
      overlay = element("overlay");
      t1 = space();
      spacer = element("spacer");
      create_component(timer.$$.fragment);
      t2 = space();
      create_component(anchores.$$.fragment);
      set_style(bg_1, "background-image", "url('" + ctx[1] + "')\n  ");
      attr(bg_1, "class", "svelte-12m8nlp");
      attr(overlay, "class", "svelte-12m8nlp");
      attr(spacer, "class", "svelte-12m8nlp");
      attr(main, "class", "svelte-12m8nlp");
    },
    m(target, anchor) {
      insert(target, main, anchor);
      append(main, bg_1);
      append(main, t0);
      append(main, overlay);
      append(main, t1);
      append(main, spacer);
      mount_component(timer, spacer, null);
      append(main, t2);
      mount_component(anchores, main, null);
      current = true;
      if (!mounted) {
        dispose = [
          listen(main, "mousemove", ctx[4]),
          listen(main, "click", ctx[5])
        ];
        mounted = true;
      }
    },
    p(ctx2, [dirty]) {
      if (!current || dirty & 2) {
        set_style(bg_1, "background-image", "url('" + ctx2[1] + "')\n  ");
      }
    },
    i(local) {
      if (current)
        return;
      add_render_callback(() => {
        if (bg_1_outro)
          bg_1_outro.end(1);
        bg_1_intro = create_in_transition(bg_1, fade, {});
        bg_1_intro.start();
      });
      add_render_callback(() => {
        if (overlay_outro)
          overlay_outro.end(1);
        overlay_intro = create_in_transition(overlay, fade, {});
        overlay_intro.start();
      });
      transition_in(timer.$$.fragment, local);
      transition_in(anchores.$$.fragment, local);
      add_render_callback(() => {
        if (main_outro)
          main_outro.end(1);
        main_intro = create_in_transition(main, fade, { duration: 1e3 });
        main_intro.start();
      });
      current = true;
    },
    o(local) {
      if (bg_1_intro)
        bg_1_intro.invalidate();
      bg_1_outro = create_out_transition(bg_1, fade, {});
      if (overlay_intro)
        overlay_intro.invalidate();
      overlay_outro = create_out_transition(overlay, fade, {});
      transition_out(timer.$$.fragment, local);
      transition_out(anchores.$$.fragment, local);
      if (main_intro)
        main_intro.invalidate();
      main_outro = create_out_transition(main, fade, { duration: 1e3 });
      current = false;
    },
    d(detaching) {
      if (detaching)
        detach(main);
      if (detaching && bg_1_outro)
        bg_1_outro.end();
      if (detaching && overlay_outro)
        overlay_outro.end();
      destroy_component(timer);
      destroy_component(anchores);
      if (detaching && main_outro)
        main_outro.end();
      mounted = false;
      run_all(dispose);
    }
  };
}
let imgsrc = "https://source.unsplash.com/random/1920x1080/?mountains,water,cloud,night";
function toDataURL(urll, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
    var reader = new FileReader();
    reader.onloadend = function() {
      callback(reader.result);
    };
    reader.readAsDataURL(xhr.response);
  };
  xhr.open("GET", urll);
  xhr.responseType = "blob";
  xhr.send();
}
function instance($$self, $$props, $$invalidate) {
  let $background;
  let m = { x: 0, y: 0 };
  const circleTransitiom = tweened(0, { duration: 700, easing: cubicOut });
  circleTransitiom.set(10);
  let background = persist(writable(firstbg), localStorage$1(), "background");
  component_subscribe($$self, background, (value) => $$invalidate(1, $background = value));
  setTimeout(function() {
    toDataURL(imgsrc, function(dataUrl) {
      tick();
      set_store_value(background, $background = dataUrl, $background);
    });
  }, 6e4);
  onMount(() => true);
  onDestroy(() => false);
  const mousemove_handler = (e) => $$invalidate(0, m = { x: e.clientX, y: e.clientY });
  const click_handler = () => circleTransitiom.set(3e4);
  return [m, $background, circleTransitiom, background, mousemove_handler, click_handler];
}
class App extends SvelteComponent {
  constructor(options) {
    super();
    init(this, options, instance, create_fragment, safe_not_equal, {}, add_css);
  }
}
new App({
  target: document.getElementById("app")
});
