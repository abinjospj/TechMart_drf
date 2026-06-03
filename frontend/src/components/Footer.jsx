export default function Footer() {
  return (
    <footer className="w-full py-4 border-t flex flex-col items-center text-sm text-gray-600 text-center">
      <p className="flex flex-col items-center gap-1">
        Developed with <span className="text-red-500">❤️</span> by{" "}
        <a
          href=""
          target="_blank"
          className="text-blue-600 hover:underline"
        >
          Abin Jos
        </a>
      </p>

      <div className="flex flex-col items-center gap-1 mt-2">
        <a
          href=""
          className="text-blue-600 hover:underline"
        >
          {" "}
        </a>

      </div>
    </footer>
  );
}

