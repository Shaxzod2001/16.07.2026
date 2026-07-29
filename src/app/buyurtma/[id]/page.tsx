import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { acceptResponseAction, completeOrderAction } from "@/lib/actions/order";
import RespondForm from "@/components/RespondForm";
import ReviewForm from "@/components/ReviewForm";

type Params = Promise<{ id: string }>;

const STATUS_LABEL: Record<string, string> = {
  OPEN: "Ochiq — takliflar kutilmoqda",
  IN_PROGRESS: "Jarayonda",
  COMPLETED: "Yakunlangan",
  CANCELLED: "Bekor qilingan",
};

export default async function OrderDetailPage({ params }: { params: Params }) {
  const user = await getCurrentUser();
  if (!user) redirect("/kirish");

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      category: true,
      client: true,
      review: true,
      responses: {
        orderBy: { createdAt: "asc" },
        include: { specialist: { include: { specialistProfile: true } } },
      },
    },
  });

  if (!order) notFound();

  const isOwner = order.clientId === user.id;
  const mySpecialistResponse =
    user.role === "SPECIALIST" ? order.responses.find((r) => r.specialistId === user.id) : undefined;

  if (!isOwner && user.role === "CLIENT") {
    // Boshqa mijozning buyurtmasi — ko'rish huquqi yo'q
    redirect("/dashboard/mijoz");
  }

  const acceptedResponse = order.responses.find((r) => r.id === order.acceptedResponseId);
  const canSeeContact =
    order.status !== "OPEN" &&
    acceptedResponse &&
    (isOwner || acceptedResponse.specialistId === user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
            {order.category.icon} {order.category.name}
          </span>
          <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
            {STATUS_LABEL[order.status]}
          </span>
        </div>
        <h1 className="mt-3 text-xl font-bold text-slate-900">{order.title}</h1>
        <p className="mt-2 text-slate-700 leading-relaxed">{order.description}</p>
        <div className="mt-3 text-sm text-slate-500 flex gap-4 flex-wrap">
          <span>Shahar: {order.city}</span>
          {(order.budgetMin || order.budgetMax) && (
            <span>
              Byudjet: {order.budgetMin ?? "?"} - {order.budgetMax ?? "?"} so&apos;m
            </span>
          )}
          {isOwner && <span>Mijoz: siz</span>}
        </div>

        {canSeeContact && (
          <div className="mt-4 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
            {isOwner
              ? `Aloqa: ${acceptedResponse!.specialist.name}, tel: ${acceptedResponse!.specialist.phone}`
              : `Mijoz aloqasi: ${order.client.name}, tel: ${order.client.phone}`}
          </div>
        )}

        {isOwner && order.status === "IN_PROGRESS" && (
          <form action={completeOrderAction.bind(null, order.id)} className="mt-4">
            <button
              type="submit"
              className="rounded-lg bg-green-600 text-white text-sm font-semibold px-4 py-2 hover:bg-green-700 transition"
            >
              Ish yakunlandi deb belgilash
            </button>
          </form>
        )}
      </div>

      {isOwner && order.status === "COMPLETED" && !order.review && (
        <div className="mt-6">
          <ReviewForm orderId={order.id} />
        </div>
      )}

      {isOwner && order.review && (
        <div className="mt-6 bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-semibold text-slate-900 mb-1">Sizning sharhingiz</h3>
          <div className="text-amber-500">
            {"★".repeat(order.review.rating)}
            {"☆".repeat(5 - order.review.rating)}
          </div>
          <p className="mt-1 text-sm text-slate-600">{order.review.comment}</p>
        </div>
      )}

      {isOwner && order.status === "OPEN" && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            Takliflar ({order.responses.length})
          </h2>
          {order.responses.length === 0 ? (
            <p className="text-slate-500 text-sm">
              Hozircha takliflar yo&apos;q. Mutaxassislar tez orada javob berishadi.
            </p>
          ) : (
            <div className="space-y-4">
              {order.responses.map((response) => (
                <div key={response.id} className="bg-white border border-slate-200 rounded-xl p-5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      {response.specialist.name}
                    </span>
                    <span className="font-bold text-blue-700">
                      {response.price.toLocaleString("uz-UZ")} so&apos;m
                    </span>
                  </div>
                  {response.specialist.specialistProfile && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      {response.specialist.specialistProfile.ratingCount > 0
                        ? `★ ${response.specialist.specialistProfile.ratingAvg.toFixed(1)} (${response.specialist.specialistProfile.ratingCount})`
                        : "Hali sharh yo'q"}
                    </div>
                  )}
                  <p className="mt-2 text-sm text-slate-600">{response.message}</p>
                  <form action={acceptResponseAction.bind(null, order.id, response.id)} className="mt-3">
                    <button
                      type="submit"
                      className="rounded-lg bg-blue-600 text-white text-sm font-semibold px-4 py-2 hover:bg-blue-700 transition"
                    >
                      Qabul qilish
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isOwner &&
        order.status !== "OPEN" &&
        order.responses
          .filter((r) => r.specialistId === user.id)
          .map((response) => (
            <div key={response.id} className="mt-6 bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-sm">
                Sizning taklifingiz:{" "}
                <span
                  className={
                    response.status === "ACCEPTED"
                      ? "text-green-600 font-semibold"
                      : "text-red-500 font-semibold"
                  }
                >
                  {response.status === "ACCEPTED" ? "Qabul qilindi" : "Rad etildi"}
                </span>
              </p>
            </div>
          ))}

      {user.role === "SPECIALIST" && order.status === "OPEN" && !mySpecialistResponse && (
        <div className="mt-6">
          <RespondForm orderId={order.id} />
        </div>
      )}

      {user.role === "SPECIALIST" && mySpecialistResponse && order.status === "OPEN" && (
        <div className="mt-6 bg-white border border-slate-200 rounded-xl p-5 text-sm text-slate-600">
          Siz bu buyurtmaga taklif yubordingiz: {mySpecialistResponse.price.toLocaleString("uz-UZ")}{" "}
          so&apos;m. Mijoz javobini kuting.
        </div>
      )}
    </div>
  );
}
