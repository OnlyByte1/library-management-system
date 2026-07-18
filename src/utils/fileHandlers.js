export const importBooksFromJson = (file, onBooksParsed) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        const booksArray = Array.isArray(json) ? json : [json];
        
        const validBooks = booksArray.filter(book => book.title);

        if (typeof onBooksParsed === 'function') {
          onBooksParsed(validBooks);
        }

        resolve(validBooks.length);
      } catch (err) {
        console.error("Детали ошибки JSON:", err);
        reject("Ошибка формата JSON");
      }
    };

    reader.onerror = () => reject("Ошибка при чтении файла");
    reader.readAsText(file);
  });
};