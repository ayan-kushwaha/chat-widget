
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Transaction } from '../modules/core/transaction/Transaction';

// Load env
dotenv.config();

const run = async () => {
    try {
        console.log("Connecting to DB...");
        // Log URI partially for safety
        const uri = process.env.MONGO_URI || '';
        console.log("URI:", uri ? uri.substring(0, 20) + '...' : 'MISSING');

        await mongoose.connect(uri);
        console.log("Connected!");

        // 1. Check if ANY document exists in 'billinglogs'
        const count = await Transaction.countDocuments({});
        console.log(`Total documents in 'billinglogs' collection: ${count}`);

        if (count === 0) {
            console.log("Collection is empty! Check collection name 'billinglogs' vs actual name in Compass.");
        } else {
            // Update all documents with missing "Professional" fields
            const allDocs = await Transaction.find({});
            console.log(`Found ${allDocs.length} docs to potentially update.`);

            for (const doc of allDocs) {
                // Generate mock data if missing
                const update: any = {
                    invoiceNumber: doc.invoiceNumber || `INV-${new Date(doc.createdAt).getFullYear()}-${Math.floor(Math.random() * 10000)}`,
                    paymentMethod: doc.paymentMethod || (Math.random() > 0.5 ? 'Visa ending 4242' : 'UPI (PhonePe)'),
                    subTotal: doc.subTotal || (doc.amount * 0.82),
                    taxAmount: doc.taxAmount || (doc.amount * 0.18),
                    billingPeriod: doc.billingPeriod?.start ? doc.billingPeriod : {
                        start: doc.createdAt,
                        end: new Date(new Date(doc.createdAt).setDate(new Date(doc.createdAt).getDate() + 30))
                    },
                    invoiceUrl: (!doc.invoiceUrl || doc.invoiceUrl === 'pending') ? 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' : doc.invoiceUrl,

                    // Create Snapshot Data
                    billingDetails: doc.billingDetails || {
                        customerName: "Aryan Kushwaha", // Mock historical name
                        companyName: "Aryan AI Pvt Ltd",
                        taxId: "09ABCDE1234F1Z5",
                        address: "123 Tech Park, Cyber City",
                        country: "India",
                        state: "Uttar Pradesh"
                    }
                };

                if (!doc.billingDetails || !doc.invoiceNumber) {
                    await Transaction.updateOne({ _id: doc._id }, { $set: update });
                    console.log(`Updated Doc ${doc._id} with Snapshot Data.`);
                }
            }
            console.log("Database update complete.");
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
};

run();
