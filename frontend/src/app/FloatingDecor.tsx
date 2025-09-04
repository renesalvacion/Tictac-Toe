"use client";
export default function FloatingDecor() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <img src="/pencil.svg" alt="" className="pen-img select-none" />
      <img src="/pencil.svg" alt="" className="pen-img-2 select-none" />
      <img src="/pencil.svg" alt="" className="pen-img-3 select-none" />
      <img src="/notebook.svg" alt="" className="book-img select-none" />
      <img src="/notebook.svg" alt="" className="book-img-2 select-none" />
      <img src="/notebook.svg" alt="" className="book-img-3 select-none" />
    </div>
  );
}


