document.getElementById('skills').addEventListener('change', function(e) {
  if (this.selectedOptions.length > 3) {
    alert('Maksimal 3 skill!');
    this.options[this.selectedIndex].selected = false;
  }
});
const stillWorking = document.getElementById('stillWorking');
    const endDate = document.getElementById('endDate');
    stillWorking.addEventListener('change', () => {
      endDate.disabled = stillWorking.checked;
      if (stillWorking.checked) endDate.value = '';
    });