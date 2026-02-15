import { useEffect, useState } from "react";
import { Alert, FlatList, View } from "react-native";
import {
    Appbar,
    Button,
    Card,
    TextInput,
    Dialog,
    Portal,
    Text,
} from "react-native-paper";
import * as SQLite from "expo-sqlite";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { black } from "react-native-paper/lib/typescript/styles/themes/v2/colors";

type Book = {
    id: number;
    title: string;
    author: string;
    category: string;
    year: number;
    description: string;
    image: string;
};

const db = SQLite.openDatabaseSync("books.db", {
    useNewConnection: true,
});

export default function MarketPage() {
    const [editId, setEditId] = useState<number | null>(null);
    const [visible, setVisible] = useState(false);
    const [books, setBooks] = useState<Book[]>([]);

    async function pickImage() {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: "images",
                allowsEditing: true,
                aspect: [3, 4],
                quality: 0.8,
            });

            if (!result.canceled) {
                setFormdata({ ...formdata, image: result.assets[0].uri });
            }
        } catch (e) {
            Alert.alert("gagal mengambil gambar");
        }
    }

    const [formdata, setFormdata] = useState({
        title: "",
        author: "",
        category: "",
        year: "",
        description: "",
        image: "",
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
                    image TEXT NOT NULL
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
                        formdata.image,
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
                            image: formdata.image,
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
                                formdata.image,
                            ],
                        );

                        const newBooks = {
                            id: Date.now(),
                            title: formdata.title,
                            author: formdata.author,
                            year: year,
                            category: formdata.category,
                            description: formdata.description,
                            image: formdata.image,
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
                    image: book.image
                });
                setEditId(book.id);
                setVisible(true);
            }

            return (
                <View>
                    <Appbar.Header>
                        <Appbar.BackAction onPress={() => { }} />
                        <Appbar.Content title="Market Page" />
                        <Appbar.Action
                            icon="plus"
                            onPress={() => {
                                setVisible(true);
                            }}
                        />
                    </Appbar.Header>

                    <View style={{ padding: 8 }}>
                        <FlatList
                            data={books}
                            keyExtractor={(item) => item.id.toString()}
                            numColumns={2}
                            columnWrapperStyle={{ justifyContent: "space-between", gap: 8 }}
                            renderItem={({ item }) => (
                                <Card style={{ width: "48%", padding: 8, marginBottom: 8 }}>
                                    <Card.Cover source={{ uri: item.image }} />
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
                                <View style={{ marginBottom: 12 }}>
                                    <View style={{ alignItems: "center" }}>
                                        {formdata.image ? (
                                            <View
                                                style={{
                                                    width: 120,
                                                    height: 120,
                                                    backgroundColor: "#f0f0f0",
                                                    borderRadius: 8,
                                                    overflow: "hidden",
                                                    marginBottom: 8,
                                                }}
                                            >
                                                <Image
                                                    source={{ uri: formdata.image }}
                                                    style={{ width: 100, height: 100 }}
                                                    resizeMode="cover"
                                                ></Image>
                                            </View>
                                        ) : (
                                            <View
                                                style={{
                                                    width: 120,
                                                    height: 120,
                                                    backgroundColor: "#F0F0F0",
                                                    borderRadius: 8,
                                                    overflow: "hidden",
                                                    marginBottom: 8,
                                                    justifyContent: "center",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <Text style={{ textAlign: "center" }}>
                                                    Gambar Tidak ada
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <Button mode="outlined" onPress={pickImage}>
                                        Pilih Gambar
                                    </Button>
                                </View>
                            </Dialog.Content>

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