
const express = require("express");
const router = express.Router();

const {
  addBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
  issueBook,
  getIssuedBooks,
  returnBook,
} = require("../controllers/bookController");

// Issued book routes - keep these before /:id
router.post("/issued-books", issueBook);
router.get("/issued-books", getIssuedBooks);
router.put("/issued-books/:id/return", returnBook);

// Normal book routes
router.post("/", addBook);
router.get("/", getBooks);
router.get("/:id", getBookById);
router.put("/:id", updateBook);
router.delete("/:id", deleteBook);

module.exports = router;
