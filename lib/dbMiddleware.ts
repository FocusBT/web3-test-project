import mongoose from "mongoose";

const connectDb = (handler) => async (req, res) => {
  if (mongoose.connections[0].readyState) return handler(req, res);

  try {
    await mongoose.connect("mongodb+srv://focus123:Memon4231@cluster0.66jjnzy.mongodb.net/?retryWrites=true&w=majority", {
      useNewUrlParser: true,
      useFindAndModify: false,
      useCreateIndex: true,
    });

    console.log('Database connected successfully');

  } catch (err) {
    console.error("Failed to connect to the database");
    console.error(err);
    // Here you could also handle the error, for example by sending a response to the client
    return res.status(500).json({error: "Failed to connect to the database"});
  }

  return handler(req, res);
};

export default connectDb;
