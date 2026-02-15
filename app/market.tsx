import { useEffect, useState } from "react";
import { Alert, FlatList, View } from "react-native";
import { Appbar, Button, Card, TextInput, Dialog, Portal, Text } from "react-native-paper";
import * as SQLite from "expo-sqlite";

type Book = {
    id: number;
    title: string;
    author: string;
    category: string;
    year: number;
    description: string;
};

const db = SQLite.openDatabaseSync("books.db", {
    useNewConnection: true,
});

export default function MarketPage() {
    const [editId, setEditId] = useState<number | null>(null);
    const [visible, setVisible] = useState(false);
    const [books, setBooks] = useState<Book[]>([]);



    const [formdata, setFormdata] = useState({
        title: "",
        author: "",
        category: "",
        year: "",
        description: "",
    });

    async function initDatabase() {
        try {
            await db.execAsync(
                `CREATE TABLE IF NOT EXISTS books (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    author TEXT NOT NULL,
                    category TEXT NOT NULL,
                    year INTEGER NOT NULL,
                    description TEXT NOT NULL,
                )`,
            );
        } catch (error) {
            console.error("Error initializing database:", error);
        }
    }

    async function loadBooks() {
        try {
            const results = await db.getAllAsync(
                `SELECT * FROM books order by id desc`,
            );
            setBooks(results as []);
        } catch (error) {
            Alert.alert("gagal memuat data buku");
        }
    }


    useEffect(() => {
        initDatabase();
        loadBooks();
    }, []);

    async function AddBooks() {
        try {

            const year = parseInt(formdata.year);
            if (editId) {
                await db.runAsync(
                    `UPDATE books SET title = ?, author = ?, category = ?, year = ?, description = ?, image = ? WHERE id = ?`,
                    [
                        formdata.title,
                        formdata.author,
                        formdata.category,
                        year,
                        formdata.description,
                        editId.toString(),
                    ],
                );
                const updatedBooks = books.map((book) => {
                    if (book.id === editId) {
                        return {
                            ...book,
                            title: formdata.title,
                            author: formdata.author,
                            category: formdata.category,
                            year: year,
                            description: formdata.description,
                        }
                    }
                    return book;
                });
                setBooks(updatedBooks);
                setEditId(null);
            } else {
                await db.runAsync(
                    `INSERT INTO books (title, author, category, year, description, image) VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        formdata.title,
                        formdata.author,
                        formdata.category,
                        year,
                        formdata.description,
                    ],
                );

                const newBooks = {
                    id: Date.now(),
                    title: formdata.title,
                    author: formdata.author,
                    year: year,
                    category: formdata.category,
                    description: formdata.description,
                };
                setBooks([...books, newBooks]);
            }
        } catch (error) {
            console.error("Error adding book:", error);
        }
    }

    async function deleteBook(id: any) {
        try {
            await db.runAsync(`DELETE FROM books WHERE id = ?`, [id]);
            setBooks(books.filter((book) => book.id !== id));
        } catch (error) {
            console.error("Error deleting book:", error);
        }
    }

    async function handleEdit(book: Book) {
        setFormdata({
            title: book.title,
            author: book.author,
            category: book.category,
            year: book.year.toString(),
            description: book.description,
        });
        setEditId(book.id);
        setVisible(true);
    }

    return (
        <View>
            <Appbar.Header style={{ backgroundColor: "#1189b5", height: 120 }}>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Appbar.BackAction onPress={() => { }} color="white" />
                        <Appbar.Content title="5 May" titleStyle={{ color: "white", fontWeight: "bold" }} />
                    </View>

                    <View style={{ flexDirection: "row", marginBottom: 10, justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginTop: 8 }}>
                        <View>
                            <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>
                                Belanja
                            </Text>
                            <Text style={{ fontSize: 14, color: "white", opacity: 0.8 }}>
                                Tambahkan List Belanjaan
                            </Text>
                        </View>
                        <Appbar.Action
                            icon="plus"
                            onPress={() => {
                                setVisible(true);
                            }}
                            color="white"
                            style={{ backgroundColor: "white", margin: 0 }}
                            iconColor="#5b4ccc"
                        />
                    </View>
                </View>
            </Appbar.Header>

            <View style={{ padding: 8 }}>
                <FlatList
                    data={books}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={2}
                    columnWrapperStyle={{ justifyContent: "space-between", gap: 8 }}
                    renderItem={({ item }) => (
                        <Card style={{ width: "48%", padding: 8, marginBottom: 8 }}>
                            <View style={{ padding: 8, gap: 5 }}>
                                <Text
                                    style={{ fontSize: 15, fontWeight: "bold", color: "black" }}
                                >
                                    {item.title}
                                </Text>
                                <Text
                                    style={{ fontSize: 10, fontWeight: "bold", color: "black" }}
                                >
                                    {item.author} - {item.year} - {item.category}
                                </Text>
                                <Text
                                    style={{ fontSize: 10, fontWeight: "bold", color: "black" }}
                                >
                                    {item.description}
                                </Text>
                            </View>

                            <View style={{ flexDirection: "column", gap: 7, marginTop: 10 }}>
                                <Button
                                    mode="contained"
                                    onPress={() => {
                                        handleEdit(item);
                                    }}
                                    buttonColor="#007aff"
                                    style={{ flex: 1 }}
                                >
                                    Edit
                                </Button>
                                <Button
                                    mode="contained"
                                    onPress={() => deleteBook(item.id)}
                                    buttonColor="red"
                                    style={{ flex: 1 }}
                                >
                                    Delete
                                </Button>
                            </View>
                        </Card>
                    )}
                />
            </View>
            <Portal>
                <Dialog visible={visible} onDismiss={() => setVisible(false)}>
                    <Dialog.Icon icon="alert" />
                    <Dialog.Title>This is a title</Dialog.Title>

                    <Dialog.Content>
                        <View style={{ marginBottom: 10 }}>
                            <TextInput
                                label={"judul"}
                                mode={"outlined"}
                                onChangeText={(text) => {
                                    setFormdata({ ...formdata, title: text });
                                }}
                                value={formdata.title}
                                style={{ marginBottom: 12 }}
                            />

                            <TextInput
                                label={"Penulis"}
                                mode={"outlined"}
                                onChangeText={(text) => {
                                    setFormdata({ ...formdata, author: text });
                                }}
                                value={formdata.author}
                                style={{ marginBottom: 12 }}
                            />

                            <TextInput
                                label={"Kategori"}
                                mode={"outlined"}
                                onChangeText={(text) => {
                                    setFormdata({ ...formdata, category: text });
                                }}
                                value={formdata.category}
                                style={{ marginBottom: 12 }}
                            />
                            <TextInput
                                label={"Tahun"}
                                mode={"outlined"}
                                onChangeText={(text) => {
                                    setFormdata({ ...formdata, year: text });
                                }}
                                value={formdata.year}
                                keyboardType="number-pad"
                                style={{ marginBottom: 12 }}
                            />

                            <TextInput
                                label={"Deskripsi"}
                                mode={"outlined"}
                                multiline
                                onChangeText={(text) => {
                                    setFormdata({ ...formdata, description: text });
                                }}
                                value={formdata.description}
                                numberOfLines={3}
                                style={{ marginBottom: 12 }}
                            />
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setVisible(false)}>Cancel</Button>
                        <Button
                            onPress={() => {
                                setVisible(false);
                                AddBooks();
                            }}
                        >
                            Save
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
}