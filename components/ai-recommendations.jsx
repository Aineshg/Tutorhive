import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Lightbulb, TrendingUp, Target, Clock, ArrowRight } from "lucide-react";

const recommendations = [
  {
    id: "1",
    type: "focus",
    title: "Focus on Integration Techniques",
    description:
      "Based on your recent performance, spend more time practicing integration by parts and substitution methods.",
    priority: "high",
    actionable: true,
  },
  {
    id: "2",
    type: "schedule",
    title: "Optimize Study Schedule",
    description:
      "Your performance data shows you're most productive between 9-11 AM. Consider scheduling difficult topics during this time.",
    priority: "medium",
    actionable: true,
  },
  {
    id: "3",
    type: "goal",
    title: "Adjust Physics Timeline",
    description: "Consider extending your quantum mechanics study plan by 1 week for better concept retention.",
    priority: "medium",
    actionable: true,
  },
  {
    id: "4",
    type: "performance",
    title: "Great Progress in Calculus",
    description: "Your calculus scores have improved by 15% this week. Keep up the excellent work!",
    priority: "low",
    actionable: false,
  },
];

const getIcon = (type) => {
  switch (type) {
    case "focus":
      return <Target className="h-4 w-4" />;
    case "schedule":
      return <Clock className="h-4 w-4" />;
    case "goal":
      return <Lightbulb className="h-4 w-4" />;
    case "performance":
      return <TrendingUp className="h-4 w-4" />;
    default:
      return <Brain className="h-4 w-4" />;
  }
};

const getColor = (type) => {
  switch (type) {
    case "focus":
      return "text-primary";
    case "schedule":
      return "text-secondary";
    case "goal":
      return "text-accent";
    case "performance":
      return "text-green-600";
    default:
      return "text-muted-foreground";
  }
};

export default function AIRecommendations() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <CardTitle className="font-serif">AI Recommendations</CardTitle>
        </div>
        <CardDescription>Personalized study suggestions based on your progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((rec) => (
          <div key={rec.id} className="p-3 border border-border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={getColor(rec.type)}>{getIcon(rec.type)}</div>
                <h4 className="font-medium text-sm">{rec.title}</h4>
              </div>
              <Badge
                variant={rec.priority === "high" ? "destructive" : rec.priority === "medium" ? "secondary" : "outline"}
              >
                {rec.priority}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{rec.description}</p>
            {rec.actionable && (
              <Button variant="outline" size="sm" className="w-full bg-transparent">
                Take Action
                <ArrowRight className="h-3 w-3 ml-2" />
              </Button>
            )}
          </div>
        ))}

        <Button variant="outline" className="w-full bg-transparent">
          View All AI Insights
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
