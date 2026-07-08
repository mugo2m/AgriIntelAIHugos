export function toast({ title, description, variant = "default" }: any) {
  if (typeof window !== 'undefined') {
    const toastEl = document.createElement('div');
    toastEl.className = `fixed top-4 right-4 p-4 rounded-md ${variant === 'destructive' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'} z-50`;
    toastEl.innerHTML = `
      <div class="font-bold">${title}</div>
      <div class="text-sm">${description}</div>
    `;
    document.body.appendChild(toastEl);
    
    setTimeout(() => {
      if (document.body.contains(toastEl)) {
        document.body.removeChild(toastEl);
      }
    }, 3000);
  }
  
  console.log(`Toast [${variant}]: ${title} - ${description}`);
  return { id: Date.now().toString() };
}
