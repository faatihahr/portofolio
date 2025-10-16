document.addEventListener('DOMContentLoaded', function() {
    const toast = document.getElementById('toast');
      if (toast) {
        setTimeout(() => {
          toast.style.display = 'none';
        }, 3000);
    }
});