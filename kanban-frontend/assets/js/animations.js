export const animations = {
    // Fade in
    fadeIn(element, duration = 300) {
      return element.animate([
        { opacity: 0 },
        { opacity: 1 }
      ], {
        duration,
        easing: 'ease-out',
        fill: 'forwards'
      });
    },
  
    // Slide in from right
    slideInRight(element, duration = 400) {
      return element.animate([
        { transform: 'translateX(100px)', opacity: 0 },
        { transform: 'translateX(0)', opacity: 1 }
      ], {
        duration,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
        fill: 'forwards'
      });
    },
  
    // Scale up
    scaleUp(element, duration = 300) {
      return element.animate([
        { transform: 'scale(0.8)', opacity: 0 },
        { transform: 'scale(1)', opacity: 1 }
      ], {
        duration,
        easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        fill: 'forwards'
      });
    },
  
    // Shake (for errors)
    shake(element) {
      return element.animate([
        { transform: 'translateX(0)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(-10px)' },
        { transform: 'translateX(10px)' },
        { transform: 'translateX(0)' }
      ], {
        duration: 500,
        easing: 'ease-in-out'
      });
    },

    // Drag start - scale down slightly
    dragStart(element, duration = 200) {
      return element.animate([
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(0.95)', opacity: 0.7 }
      ], {
        duration,
        easing: 'ease-out',
        fill: 'forwards'
      });
    },

    // Drag end - scale back to normal
    dragEnd(element, duration = 200) {
      return element.animate([
        { transform: 'scale(0.95)', opacity: 0.7 },
        { transform: 'scale(1)', opacity: 1 }
      ], {
        duration,
        easing: 'ease-out',
        fill: 'forwards'
      });
    },

    // Drop animation - bounce effect
    dropBounce(element, duration = 400) {
      return element.animate([
        { transform: 'scale(0.9)' },
        { transform: 'scale(1.05)' },
        { transform: 'scale(0.98)' },
        { transform: 'scale(1)' }
      ], {
        duration,
        easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        fill: 'forwards'
      });
    },

    // Highlight drop zone
    highlightZone(element, duration = 300) {
      return element.animate([
        { 
          backgroundColor: 'transparent',
          borderColor: 'transparent'
        },
        { 
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 0.5)'
        }
      ], {
        duration,
        easing: 'ease-out',
        fill: 'forwards'
      });
    },

    // Remove highlight from drop zone
    unhighlightZone(element, duration = 200) {
      return element.animate([
        { 
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 0.5)'
        },
        { 
          backgroundColor: 'transparent',
          borderColor: 'transparent'
        }
      ], {
        duration,
        easing: 'ease-out',
        fill: 'forwards'
      });
    },

    // Pulse animation for new tasks
    pulse(element, duration = 600) {
      return element.animate([
        { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.7)' },
        { transform: 'scale(1.02)', boxShadow: '0 0 0 10px rgba(59, 130, 246, 0)' },
        { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' }
      ], {
        duration,
        easing: 'ease-out'
      });
    }
  };
  