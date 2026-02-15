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

const db = SQLite.openDatabaseSync("makanan.db", {
    useNewConnection: true,
});

export default function MarketPage() {
    const [editId, setEditId] = useState<number | null>(null);
    const [visible, setVisible] = useState(false);
    const [makanan, setMakanan] = useState<Book[]>([]);



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
                `CREATE TABLE IF NOT EXISTS makanan (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    author TEXT NOT NULL,
                    category TEXT NOT NULL,
                    year INTEGER NOT NULL,
                    description TEXT NOT NULL
                )`
            );
        } catch (error) {
            console.error("Error initializing database:", error);
        }
    }

    async function loadMakanan() {
        try {
            const results = await db.getAllAsync(
                `SELECT * FROM makanan order by id desc`,
            );
            setMakanan(results as []);
        } catch (error) {
            Alert.alert("gagal memuat data buku");
        }
    }


    useEffect(() => {
        initDatabase();
        loadMakanan();
    }, []);

    async function AddMakanan() {
        try {

            const year = parseInt(formdata.year);
            if (editId) {
                await db.runAsync(
                    `UPDATE makanan SET title = ?, author = ?, category = ?, year = ?, description = ? WHERE id = ?`,
                    [
                        formdata.title,
                        formdata.author,
                        formdata.category,
                        year,
                        formdata.description,
                        editId.toString(),
                    ],
                );
                const updatedMakanan = makanan.map((item) => {
                    if (item.id === editId) {
                        return {
                            ...item,
                            title: formdata.title,
                            author: formdata.author,
                            category: formdata.category,
                            year: year,
                            description: formdata.description,
                        }
                    }
                    return item;
                });
                setMakanan(updatedMakanan);
                setEditId(null);
            } else {
                await db.runAsync(
                    `INSERT INTO makanan (title, author, category, year, description) VALUES (?, ?, ?, ?, ?)`,
                    [
                        formdata.title,
                        formdata.author,
                        formdata.category,
                        year,
                        formdata.description,
                    ],
                );

                const newMakanan = {
                    id: Date.now(),
                    title: formdata.title,
                    author: formdata.author,
                    year: year,
                    category: formdata.category,
                    description: formdata.description,
                };
                setMakanan([...makanan, newMakanan]);
            }
        } catch (error) {
            console.error("Error adding makanan:", error);
        }
    }

    async function deleteMakanan(id: any) {
        try {
            await db.runAsync(`DELETE FROM makanan WHERE id = ?`, [id]);
            setMakanan(makanan.filter((item) => item.id !== id));
        } catch (error) {
            console.error("Error deleting makanan:", error);
        }
    }

    async function handleEdit(makananItem: Book) {
        setFormdata({
            title: makananItem.title,
            author: makananItem.author,
            category: makananItem.category,
            year: makananItem.year.toString(),
            description: makananItem.description,
        });
        setEditId(makananItem.id);
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
                    data={makanan}
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
                                    onPress={() => deleteMakanan(item.id)}
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
                <Dialog style={{ backgroundColor: "white" }} visible={visible} onDismiss={() => setVisible(false)}>
                    <Dialog.Icon icon="alert" />
                    <Dialog.Title style={{ color: "black" , fontWeight: "bold"}}>Masukkan Deskripsi</Dialog.Title>

                    <Dialog.Content>
                        <View style={{ marginBottom: 10 }}>
                            <TextInput
                                label={"judul"}
                                mode={"outlined"}
                                onChangeText={(text) => {
                                    setFormdata({ ...formdata, title: text });
                                }}
                                value={formdata.title}
                                textColor="black"
                                style={{color: "black", marginBottom: 12, borderColor: "black", backgroundColor: "white" }}
                            />

                            <TextInput
                                label={"Penulis"}
                                mode={"outlined"}
                                onChangeText={(text) => {
                                    setFormdata({ ...formdata, author: text });
                                }}
                                value={formdata.author}
                                textColor="black"
                                style={{ marginBottom: 12, borderColor: "black", backgroundColor: "white" }}
                            />

                            <TextInput
                                label={"Kategori"}
                                mode={"outlined"}
                                onChangeText={(text) => {
                                    setFormdata({ ...formdata, category: text });
                                }}
                                value={formdata.category}
                                textColor="black"
                                style={{ marginBottom: 12, borderColor: "black", backgroundColor: "white" }}
                            />
                            <TextInput
                                label={"Tahun"}
                                mode={"outlined"}
                                onChangeText={(text) => {
                                    setFormdata({ ...formdata, year: text });
                                }}
                                value={formdata.year}
                                textColor="black"
                                keyboardType="number-pad"
                                style={{ marginBottom: 12, borderColor: "black", backgroundColor: "white" }}
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
                                textColor="black"
                                style={{ marginBottom: 12, borderColor: "black", backgroundColor: "white" }}
                            />
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setVisible(false)}>Cancel</Button>
                        <Button
                            onPress={() => {
                                setVisible(false);
                                AddMakanan();
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