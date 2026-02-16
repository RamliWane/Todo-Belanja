import { useEffect, useState } from "react";
import { Alert, FlatList, View } from "react-native";
import { Appbar, Button, Card, TextInput, Dialog, Portal, Text } from "react-native-paper";
import * as SQLite from "expo-sqlite";

type Belanja = {
    id: number;
    title: string;
    category: string;
    harga: number;
};

const db = SQLite.openDatabaseSync("belanja.db", {
    useNewConnection: true,
});

export default function MarketPage() {
    const [editId, setEditId] = useState<number | null>(null);
    const [visible, setVisible] = useState(false);
    const [belanja, setBelanja] = useState<Belanja[]>([]);



    const [formdata, setFormdata] = useState({
        title: "",
        category: "",
        harga: "",
    });

    async function initDatabase() {
        try {
            await db.execAsync(
                `CREATE TABLE IF NOT EXISTS belanja (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    category TEXT NOT NULL,
                    harga INTEGER NOT NULL
                )`
            );
        } catch (error) {
            console.error("Error initializing database:", error);
        }
    }

    async function loadBelanja() {
        try {
            const results = await db.getAllAsync(
                `SELECT * FROM belanja order by id desc`,
            );
            setBelanja(results as []);

        } catch (error) {
            Alert.alert("gagal memuat data belanja");
        }
    }


    useEffect(() => {
        initDatabase();
        loadBelanja();
    }, []);

    async function AddBelanja() {
        try {

            const harga = parseInt(formdata.harga);
            if (editId) {
                await db.runAsync(
                    `UPDATE belanja SET title = ?,category = ?, harga = ? WHERE id = ?`,
                    [
                        formdata.title,
                        formdata.category,
                        harga,
                        editId.toString()
                    ],
                );
                const updatedBelanja = belanja.map((item) => {
                    if (item.id === editId) {
                        return {
                            ...item,
                            title: formdata.title,
                            category: formdata.category,
                            harga: harga
                        }
                    }
                    return item;
                });
                setBelanja(updatedBelanja);
                setEditId(null);
            } else {
                await db.runAsync(
                    `INSERT INTO belanja (title, category, harga) VALUES (?, ?, ?)`,
                    [
                        formdata.title,
                        formdata.category,
                        harga
                    ],
                );

                const newBelanja = {
                    id: Date.now(),
                    title: formdata.title,
                    harga: harga,
                    category: formdata.category
                };
                setBelanja([...belanja, newBelanja]);
            }
        } catch (error) {
            console.error("Error adding belanja:", error);
        }
    }

    async function deleteBelanja(id: any) {
        try {
            await db.runAsync(`DELETE FROM belanja WHERE id = ?`, [id]);
            setBelanja(belanja.filter((item) => item.id !== id));
        } catch (error) {
            console.error("Error deleting belanja:", error);
        }
    }

    async function handleEdit(belanjaItem: Belanja) {
        setFormdata({
            title: belanjaItem.title,
            category: belanjaItem.category,
            harga: belanjaItem.harga.toString()
        });
        setEditId(belanjaItem.id);
        setVisible(true);
    }

    return (
        <View>
            <Appbar.Header style={{ backgroundColor: "#1189b5", height: 120 }}>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Appbar.BackAction onPress={() => { }} color="white" />
                        <Appbar.Content title="Hari Ini" titleStyle={{ color: "white", fontWeight: "bold" }} />
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
                            color="gray"
                            style={{ backgroundColor: "white", margin: 0 }}
                        />
                    </View>
                </View>
            </Appbar.Header>

            <View style={{ padding: 8 }}>
                <FlatList
                    data={belanja}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <Card style={{ width: "auto", padding: 8, marginBottom: 8, backgroundColor: "#e9e9e9", shadowColor: "#000", shadowOffset: { width: 2, height: 5 } }}>
                            <View style={{flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8}}>
                                <View style={{ padding: 8, gap: 5, paddingLeft: 10, flexDirection: "column", alignItems: "flex-start" }}>
                                    <Text
                                        style={{ fontSize: 18, fontWeight: "bold", color: "black" }}
                                    >
                                        {item.title}
                                    </Text>

                                    <Text
                                        style={{ fontSize: 14, fontWeight: "semibold", color: "black" }}
                                    >
                                        Category : {item.category}
                                    </Text>
                                    <Text
                                        style={{ fontSize: 20, fontWeight: "bold", color: "#82093b" }}
                                    >
                                        Rp {item.harga}
                                    </Text>

                                </View>
                                <View style={{ flexDirection: "row", gap: 8 }}>
                                    <Button
                                        mode="contained"
                                        onPress={() => {
                                            handleEdit(item);
                                        }}
                                        buttonColor="#1189b5"
                                        textColor="white"
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        mode="contained"
                                        onPress={() => deleteBelanja(item.id)}
                                        buttonColor="#82093b"
                                        textColor="white"
                                    >
                                        Delete
                                    </Button>
                                </View>
                            </View>
                        </Card>
                    )}
                />
            </View>
            <Portal>
                <Dialog style={{ backgroundColor: "white" }} visible={visible} onDismiss={() => setVisible(false)}>
                    <Dialog.Icon icon="alert" />
                    <Dialog.Title style={{ color: "black", fontWeight: "bold" }}>Masukkan Deskripsi</Dialog.Title>
                    <Dialog.Content>
                        <View style={{ marginBottom: 10 }}>
                            <TextInput
                                label={"Nama Makanan"}
                                mode={"outlined"}
                                onChangeText={(text) => {
                                    setFormdata({ ...formdata, title: text });
                                }}
                                value={formdata.title}
                                textColor="black"
                                style={{ color: "black", marginBottom: 12, borderColor: "black", backgroundColor: "white" }}
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
                                label={"Harga"}
                                mode={"outlined"}
                                onChangeText={(text) => {
                                    setFormdata({ ...formdata, harga: text });
                                }}
                                value={formdata.harga}
                                textColor="black"
                                keyboardType="numeric"
                                style={{ marginBottom: 12, borderColor: "black", backgroundColor: "white" }}
                            />

                        </View>
                    </Dialog.Content>
                    <Dialog.Actions>
                        <Button onPress={() => setVisible(false)}>Cancel</Button>
                        <Button
                            onPress={() => {
                                setVisible(false);
                                AddBelanja();
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