//TOAST NOTIFICATION
document.addEventListener('DOMContentLoaded', function() {
  console.log('Jumlah tombol delete:', document.querySelectorAll('.delete-btn').length);
  console.log('Jumlah tombol edit:', document.querySelectorAll('.edit-btn').length);

  function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    setTimeout(() => { toast.className = 'toast'; }, 2200);
  }

  // DELETE
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const id = this.dataset.id;
      const type = this.dataset.type;
      if (!id) {
        showToast('ID data tidak ditemukan!', 'error');
        return;
      }
      if (confirm('Yakin ingin menghapus data ini?')) {
        fetch(`/dashboard/${type}/delete/${id}`, { method: 'POST' })
          .then(res => {
            if (!res.ok) {
              const errorText = res.status === 403 ? 'Akses ditolak (Harus Login)!' : `Gagal menghapus data! Status: ${res.status}`;
              throw new Error(errorText);
            }
            return res.json();
          })
          .then(data => {
            showToast('Data berhasil dihapus!', 'success'); 
            setTimeout(() => window.location.reload(), 1200); 
          })
          .catch(error => {
            console.error('Error deleting data:', error);
            showToast('Gagal menghapus data!', 'error');
          });
      }
    });
  });

  // EDIT
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
      const id = this.dataset.id;
      const type = this.dataset.type;
      if (!id) {
        showToast('ID data tidak ditemukan!', 'error');
        return;
      }
      try {
        // Fetch data detail
        const res = await fetch(`/dashboard/${type}/detail/${id}`);
        if (!res.ok) {
          const errorText = res.status === 403 ? 'Akses ditolak (Harus Login)!' : `Gagal memuat data! Status: ${res.status}`;
          throw new Error(errorText);
        }
        const data = await res.json();
        if (!data) {
          throw new Error('Data not found');
        }
        // Render form fields
        const fields = document.getElementById('editFields');
        fields.innerHTML = '';
        if (type === 'project') {
          fields.innerHTML = `
            <label>Judul Proyek</label>
            <input type="text" name="title" value="${data.title || ''}" required>

            <label>Gambar Saat Ini</label>
            ${data.image ? `<img src="${data.image}" alt="Gambar Proyek" style="max-width: 100px; margin-bottom: 10px;">` : '<span>Tidak ada gambar</span>'}
            
            <label>Upload Gambar Baru (Kosongkan jika tidak ingin mengubah)</label>
            <input type="file" name="image" accept="image/*">
            <input type="hidden" name="oldImage" value="${data.image || ''}">

            <label>Deskripsi</label>
            <textarea name="description">${data.description || ''}</textarea>
            <label>Kategori</label>
            <input type="text" name="category" value="${data.category || ''}">
            <label>Link</label>
            <input type="url" name="link" value="${data.link || ''}">
            <label>Status</label>
            <input type="text" name="status" value="${data.status || ''}">
            <input type="hidden" name="id" value="${data.id}">
          `;
        } else {
          fields.innerHTML = `
            <label>Nama Pekerjaan</label>
            <input type="text" name="job_name" value="${data.job_name || ''}" required>
            <label>Jabatan</label>
            <input type="text" name="position" value="${data.position || ''}" required>
            <label>Nama Perusahaan</label>
            <input type="text" name="company" value="${data.company || ''}" required>
            <label>Periode</label>
            <input type="date" name="start_date" value="${data.start_date || ''}">
            <input type="date" name="end_date" value="${data.end_date || ''}">
            <label>Logo Saat Ini</label>
            ${data.logo ? `<img src="${data.logo}" alt="Logo Perusahaan" style="max-width: 100px; margin-bottom: 10px;">` : '<span>Tidak ada logo</span>'}

            <label>Upload Logo Baru</label>
            <input type="file" name="logo" accept="image/*">
            <input type="hidden" name="oldLogo" value="${data.logo || ''}">
            <label>Deskripsi</label>
            <textarea name="description">${data.description || ''}</textarea>
            <label>Skill</label>
            <input type="text" name="skills" value="${data.skills || ''}">
            <input type="hidden" name="id" value="${data.id}">
          `;
        }
        document.getElementById('editOverlay').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        document.getElementById('editForm').onsubmit = async function(e) {
          e.preventDefault();
          const formData = new FormData(this);
          try {
            const updateRes = await fetch(`/dashboard/${type}/update/${id}`, {
              method: 'POST',
              body: formData
            });
            if (!updateRes.ok) {
              throw new Error(`Update failed! status: ${updateRes.status}`);
            }

            const updateData = await updateRes.json();
            showToast('Data berhasil di edit!', 'success');
            setTimeout(() => window.location.href = '/', 1200); 

          } catch (error) {
            console.error('Error updating data:', error);
            showToast(error.message.startsWith('Akses') ? error.message : 'Gagal mengedit data!', 'error');
          }
        };
      } catch (error) {
        console.error('Error fetching data:', error);
        showToast(error.message.startsWith('Akses') ? error.message : 'Gagal memuat data untuk edit!', 'error');
      }
    });
  });

  document.getElementById('closeOverlay').onclick = function() {
    document.getElementById('editOverlay').style.display = 'none';
  };
});
