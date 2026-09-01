export async function createNotification(
  client: any,
  input: {
    type: string;
    title: string;
    message: string;
    userId?: number | null;
  }
) {
  return client.orm.public.Notification.create({
    type: input.type,
    title: input.title,
    message: input.message,
    isRead: false,
    userId: input.userId ?? null,
  });
}

export async function createLowStockNotification(
  client: any,
  input: {
    productName: string;
    stock: number;
    unit: string;
    limit: number;
  }
) {
  if (input.stock > input.limit) return;

  const title =
    `Low Stock: ${input.productName}`;

  const existing =
    await client.orm.public.Notification
      .where({
        type: "Stock",
        title,
        isRead: false,
      })
      .all();

  if (existing.length > 0) return;

  return createNotification(client, {
    type: "Stock",
    title,
    message:
      `${input.productName} stock is ${input.stock} ${input.unit}. Low-stock limit is ${input.limit}.`,
  });
}
