import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Heart, Wrench, Lightbulb, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeedbackModal } from "./FeedbackModal";
import { MyFeedbacks } from "./MyFeedbacks";
import { PublicRoadmap } from "./PublicRoadmap";

export function FeedbackPortal() {
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<"like" | "improvement" | "feature">("improvement");

  const openModal = (type: "like" | "improvement" | "feature") => {
    setDefaultType(type);
    setModalOpen(true);
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            Feedback & Melhorias
          </h1>
          <p className="text-muted-foreground mt-2 text-lg max-w-3xl">
            Sua opinião ajuda a gente a melhorar o Kubo Analytics. Conte o que está funcionando bem, o que podemos melhorar e quais recursos você gostaria de ver no futuro.
          </p>
        </div>

        <Tabs defaultValue="new" className="space-y-8">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="new">Novo Feedback</TabsTrigger>
            <TabsTrigger value="mine">Meus Feedbacks</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap Público</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-0 outline-none">
            <h2 className="text-2xl font-bold mb-6">O que você acha do Kubo?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Like */}
              <div className="bg-card border rounded-xl p-6 shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
                <div className="p-3 bg-red-100 text-red-600 rounded-xl mb-4">
                  <Heart className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">O que você gosta?</h3>
                <p className="text-muted-foreground mb-6 flex-grow">
                  Conte o que está funcionando bem para você e o que mais gosta na plataforma.
                </p>
                <Button className="w-full" variant="outline" onClick={() => openModal("like")}>
                  Quero elogiar
                </Button>
              </div>

              {/* Improvement */}
              <div className="bg-card border rounded-xl p-6 shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl mb-4">
                  <Wrench className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">O que podemos melhorar?</h3>
                <p className="text-muted-foreground mb-6 flex-grow">
                  Encontrou algo difícil, confuso ou que poderia funcionar melhor?
                </p>
                <Button className="w-full" variant="outline" onClick={() => openModal("improvement")}>
                  Sugerir melhoria
                </Button>
              </div>

              {/* Feature */}
              <div className="bg-card border rounded-xl p-6 shadow-sm flex flex-col items-start hover:shadow-md transition-shadow">
                <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl mb-4">
                  <Lightbulb className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">Que recurso você quer?</h3>
                <p className="text-muted-foreground mb-6 flex-grow">
                  Tem uma ideia de funcionalidade que faria grande diferença para você?
                </p>
                <Button className="w-full" variant="outline" onClick={() => openModal("feature")}>
                  Enviar ideia
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="mine" className="mt-0 outline-none">
            <MyFeedbacks />
          </TabsContent>

          <TabsContent value="roadmap" className="mt-0 outline-none">
            <PublicRoadmap />
          </TabsContent>
        </Tabs>

        <FeedbackModal 
          open={modalOpen} 
          onOpenChange={setModalOpen} 
          defaultType={defaultType} 
        />
      </div>
    </AppLayout>
  );
}
