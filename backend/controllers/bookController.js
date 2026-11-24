
const mongoose = require("mongoose");
const Book = require("../models/Book");
const IssuedBook = require("../models/IssuedBook");

// Add a book
exports.addBook = async (req, res) => {
  try {
    const {
      bookId,
      title,
      category,
      author,
      totalCopies,
    } = req.body;

    if (
      !bookId?.trim() ||
      !title?.trim() ||
      !category?.trim() ||
      !author?.trim() ||
      totalCopies === undefined ||
      totalCopies === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all fields.",
      });
    }

    const copies = Number(totalCopies);

    if (!Number.isInteger(copies) || copies < 1) {
      return res.status(400).json({
        success: false,
        message: "Total copies must be a whole number greater than zero.",
      });
    }

    const existingBook = await Book.findOne({
      bookId: bookId.trim(),
    });

    if (existingBook) {
      return res.status(409).json({
        success: false,
        message: "This Book ID already exists.",
      });
    }

    const book = await Book.create({
      bookId: bookId.trim(),
      title: title.trim(),
      category: category.trim(),
      author: author.trim(),
      totalCopies: copies,
      availableCopies: copies,
    });

    return res.status(201).json({
      success: true,
      message: "Book added successfully.",
      data: book,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This Book ID already exists.",
      });
    }

    console.error("Add book error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add book.",
    });
  }
};

// Get all books
exports.getBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    console.error("Get books error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch books.",
    });
  }
};

// Get one book
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: book,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID.",
      });
    }

    console.error("Get book error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch book.",
    });
  }
};

// Update a book
exports.updateBook = async (req, res) => {
  try {
    const {
      bookId,
      title,
      category,
      author,
      totalCopies,
      availableCopies,
    } = req.body;

    const updates = {};

    if (bookId !== undefined) updates.bookId = String(bookId).trim();
    if (title !== undefined) updates.title = String(title).trim();
    if (category !== undefined) updates.category = String(category).trim();
    if (author !== undefined) updates.author = String(author).trim();

    if (totalCopies !== undefined) {
      const copies = Number(totalCopies);

      if (!Number.isInteger(copies) || copies < 1) {
        return res.status(400).json({
          success: false,
          message: "Total copies must be a whole number greater than zero.",
        });
      }

      updates.totalCopies = copies;
    }

    if (availableCopies !== undefined) {
      const available = Number(availableCopies);

      if (!Number.isInteger(available) || available < 0) {
        return res.status(400).json({
          success: false,
          message: "Available copies must be zero or greater.",
        });
      }

      updates.availableCopies = available;
    }

    if (
      updates.totalCopies !== undefined &&
      updates.availableCopies !== undefined &&
      updates.availableCopies > updates.totalCopies
    ) {
      return res.status(400).json({
        success: false,
        message: "Available copies cannot exceed total copies.",
      });
    }

    const book = await Book.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Book updated successfully.",
      data: book,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This Book ID already exists.",
      });
    }

    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID.",
      });
    }

    console.error("Update book error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update book.",
    });
  }
};

// Delete a book
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Book deleted successfully.",
    });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        success: false,
        message: "Invalid book ID.",
      });
    }

    console.error("Delete book error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete book.",
    });
  }
};


exports.issueBook = async (req, res) => {
  try {
    const {
      userId,
      userType,
      bookId,
      issuedDate,
      dueDate,
    } = req.body;

    if (
      !userId?.trim() ||
      !userType ||
      !bookId?.trim() ||
      !issuedDate ||
      !dueDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all issue details.",
      });
    }

    if (!["Student", "Teacher"].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user type.",
      });
    }

    const issueDate = new Date(issuedDate);
    const returnDueDate = new Date(dueDate);

    if (
      Number.isNaN(issueDate.getTime()) ||
      Number.isNaN(returnDueDate.getTime()) ||
      returnDueDate < issueDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid issue and due dates.",
      });
    }

    // Find the book and reserve one available copy atomically.
    const book = await Book.findOneAndUpdate(
      {
        bookId: bookId.trim(),
        availableCopies: { $gt: 0 },
      },
      {
        $inc: { availableCopies: -1 },
      },
      { new: true }
    );

    if (!book) {
      const existingBook = await Book.findOne({
        bookId: bookId.trim(),
      });

      return res.status(400).json({
        success: false,
        message: existingBook
          ? "No copies of this book are currently available."
          : "Book not found.",
      });
    }

    try {
      const issuedBook = await IssuedBook.create({
        book: book._id,
        bookId: book.bookId,
        userId: userId.trim(),
        userType,
        issuedDate: issueDate,
        dueDate: returnDueDate,
      });

      return res.status(201).json({
        success: true,
        message: "Book issued successfully.",
        data: issuedBook,
      });
    } catch (error) {
      // Restore the copy if saving the issue record fails.
      await Book.findByIdAndUpdate(book._id, {
        $inc: { availableCopies: 1 },
      });

      throw error;
    }
  } catch (error) {
    console.error("Issue book error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to issue book.",
    });
  }
};

exports.getIssuedBooks = async (req, res) => {
  try {
    const issuedBooks = await IssuedBook.find()
      .populate("book", "title author category")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: issuedBooks.length,
      data: issuedBooks,
    });
  } catch (error) {
    console.error("Get issued books error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch issued books.",
    });
  }
};


exports.returnBook = async (req, res) => {
  try {
    const { returnDate, fine } = req.body;

    if (!returnDate) {
      return res.status(400).json({
        success: false,
        message: "Return date is required",
      });
    }

    const parsedReturnDate = new Date(returnDate);
    const fineAmount = Number(fine || 0);

    if (isNaN(parsedReturnDate.getTime()) || fineAmount < 0 || !Number.isFinite(fineAmount)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid return date and fine",
      });
    }

    const issuedBook = await IssuedBook.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "Issued",
      },
      {
        $set: {
          status: "Returned",
          returnedAt: parsedReturnDate,
          fine: fineAmount,
        },
      },
      { new: true }
    );

    if (!issuedBook) {
      return res.status(404).json({
        success: false,
        message: "Issued book not found or already returned",
      });
    }

    const book = await Book.findOneAndUpdate(
      {
        _id: issuedBook.book,
        $expr: { $lt: ["$availableCopies", "$totalCopies"] },
      },
      {
        $inc: { availableCopies: 1 },
      },
      { new: true }
    );

    if (!book) {
      // Restore the issue record if the inventory update fails.
      await IssuedBook.findByIdAndUpdate(issuedBook._id, {
        status: "Issued",
        returnedAt: null,
        fine: 0,
      });

      return res.status(400).json({
        success: false,
        message: "Unable to update available book copies",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Book returned successfully",
      data: issuedBook,
    });
  } catch (error) {
    console.error("Return Book Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while returning book",
    });
  }
};