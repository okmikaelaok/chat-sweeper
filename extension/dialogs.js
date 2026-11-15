globalThis.ChatSweeperDialogs = {
  anchor(dialog, trigger, bounds = null) {
    function position() {
      if (!dialog.open) return;
      const viewport = window.visualViewport;
      const leftEdge = viewport?.offsetLeft || 0, topEdge = viewport?.offsetTop || 0;
      const rightEdge = leftEdge + (viewport?.width || innerWidth), bottomEdge = topEdge + (viewport?.height || innerHeight);
      const button = trigger.getBoundingClientRect(), area = bounds?.getBoundingClientRect();
      const minLeft = Math.max(leftEdge + 12, area ? area.left + 8 : leftEdge + 12);
      const maxRight = Math.min(rightEdge - 12, area ? area.right - 8 : rightEdge - 12);
      const width = Math.max(1,Math.min(460,maxRight - minLeft));
      Object.assign(dialog.style,{position:'fixed',margin:'0',inset:'auto',boxSizing:'border-box',width:width + 'px',maxWidth:width + 'px'});
      const left = Math.max(minLeft,Math.min(button.right - width,maxRight - width));
      const anchorTop = Math.max(topEdge + 12,Math.min(button.top,bottomEdge - 12));
      const anchorBottom = Math.max(topEdge + 12,Math.min(button.bottom,bottomEdge - 12));
      const spaceBelow = bottomEdge - anchorBottom - 20, spaceAbove = anchorTop - topEdge - 20;
      const below = spaceBelow >= 160 || spaceBelow >= spaceAbove;
      dialog.style.maxHeight = Math.max(1,below ? spaceBelow : spaceAbove) + 'px';
      const height = dialog.getBoundingClientRect().height;
      const preferredTop = below ? anchorBottom + 8 : anchorTop - height - 8;
      const top = Math.max(topEdge + 12,Math.min(preferredTop,bottomEdge - height - 12));
      dialog.style.left = left + 'px';
      dialog.style.top = top + 'px';
    }
    window.addEventListener('resize',position);
    window.addEventListener('scroll',position,true);
    window.visualViewport?.addEventListener('resize',position);
    window.visualViewport?.addEventListener('scroll',position);
    return () => {
      if (!dialog.open) dialog.showModal();
      position();
      dialog.querySelector('button')?.focus({preventScroll:true});
      dialog.scrollTop = 0;
    };
  }
};
