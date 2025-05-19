"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { format } from "date-fns"
import { CalendarIcon, HelpCircle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import PredictionResults from "./prediction-results"
import { fetchDepartments, fetchTeams, submitPrediction } from "@/lib/api"

const formSchema = z.object({
  date: z
    .date({
      required_error: "Evaluation date is required",
    })
    .refine((date) => date <= new Date(), {
      message: "Date cannot be in the future",
    }),
  department: z.string({
    required_error: "Department is required",
  }),
  team: z.string({
    required_error: "Team is required",
  }),
  targeted_productivity: z
    .number({
      required_error: "Targeted productivity is required",
    })
    .min(0)
    .max(150),
  smv_minutes: z.coerce
    .number({
      required_error: "SMV is required",
    })
    .min(0)
    .multipleOf(0.1),
  over_time_hours: z.coerce
    .number({
      required_error: "Overtime hours is required",
    })
    .min(0)
    .max(8)
    .int(),
  incentive_level: z.enum(["None", "Low", "Standard", "High"], {
    required_error: "Incentive level is required",
  }),
  idle_time_minutes: z.coerce
    .number({
      required_error: "Idle time is required",
    })
    .min(0)
    .int(),
  idle_men_count: z.coerce
    .number({
      required_error: "Idle men count is required",
    })
    .min(0)
    .int(),
  style_change_count: z.coerce
    .number({
      required_error: "Style change count is required",
    })
    .min(0)
    .int(),
  worker_count: z.coerce
    .number({
      required_error: "Worker count is required",
    })
    .min(1)
    .int(),
})

type FormValues = z.infer<typeof formSchema>

export default function PerformancePredictionForm() {
  const [departments, setDepartments] = useState<string[]>([])
  const [teams, setTeams] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [predictionResult, setPredictionResult] = useState<any>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      targeted_productivity: 75,
      smv_minutes: 2.5,
      over_time_hours: 1,
      incentive_level: "Standard",
      idle_time_minutes: 30,
      idle_men_count: 1,
      style_change_count: 2,
      worker_count: 50,
    },
  })

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [deptData, teamData] = await Promise.all([fetchDepartments(), fetchTeams()])
        setDepartments(deptData)
        setTeams(teamData)
      } catch (error) {
        console.error("Failed to load metadata:", error)
      }
    }

    loadMetadata()
  }, [])

  async function onSubmit(values: FormValues) {
    setIsLoading(true)
    try {
      // Format the date to YYYY-MM-DD
      const formattedValues = {
        ...values,
        date: format(values.date, "yyyy-MM-dd"),
      }

      const result = await submitPrediction(formattedValues)
      setPredictionResult(result)
    } catch (error) {
      console.error("Prediction failed:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Field */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Evaluation Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Department Field */}
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Production Department</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Team Field */}
            <FormField
              control={form.control}
              name="team"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Production Team</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team} value={team}>
                          {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Targeted Productivity Field */}
            <FormField
              control={form.control}
              name="targeted_productivity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Targeted Productivity (%)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 ml-1 inline-block text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-[200px]">The expected productivity level as a percentage (0-150%)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Slider
                        min={0}
                        max={150}
                        step={1}
                        value={[field.value]}
                        onValueChange={(value) => field.onChange(value[0])}
                      />
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">0%</span>
                        <span className="text-sm font-medium">{field.value}%</span>
                        <span className="text-sm text-muted-foreground">150%</span>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SMV Minutes Field */}
            <FormField
              control={form.control}
              name="smv_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Standard Minute Value (SMV)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 ml-1 inline-block text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-[200px]">The standard time required to complete a task (in minutes)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="2.5"
                      {...field}
                      onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>Enter value with 1 decimal place</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Overtime Hours Field */}
            <FormField
              control={form.control}
              name="over_time_hours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overtime Hours</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number.parseInt(value))}
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select hours" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((hours) => (
                        <SelectItem key={hours} value={hours.toString()}>
                          {hours} {hours === 1 ? "hour" : "hours"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Incentive Level Field */}
            <FormField
              control={form.control}
              name="incentive_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bonus / Incentive Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select incentive level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["None", "Low", "Standard", "High"].map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Idle Time Minutes Field */}
            <FormField
              control={form.control}
              name="idle_time_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Idle Time (minutes)
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 ml-1 inline-block text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-[200px]">Time when production was halted (in minutes)</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="30"
                      {...field}
                      onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Idle Men Count Field */}
            <FormField
              control={form.control}
              name="idle_men_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Idle Workers</FormLabel>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (field.value > 0) {
                          field.onChange(field.value - 1)
                        }
                      }}
                    >
                      -
                    </Button>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        className="text-center"
                        {...field}
                        onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                      />
                    </FormControl>
                    <Button type="button" variant="outline" size="icon" onClick={() => field.onChange(field.value + 1)}>
                      +
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Style Change Count Field */}
            <FormField
              control={form.control}
              name="style_change_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Style Change Count
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 ml-1 inline-block text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="w-[200px]">Number of times production style was changed</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (field.value > 0) {
                          field.onChange(field.value - 1)
                        }
                      }}
                    >
                      -
                    </Button>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        className="text-center"
                        {...field}
                        onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                      />
                    </FormControl>
                    <Button type="button" variant="outline" size="icon" onClick={() => field.onChange(field.value + 1)}>
                      +
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Worker Count Field */}
            <FormField
              control={form.control}
              name="worker_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Number of Workers</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      placeholder="50"
                      {...field}
                      onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Predicting...
              </>
            ) : (
              "Predict Performance"
            )}
          </Button>
        </form>
      </Form>

      {predictionResult && <PredictionResults result={predictionResult} />}
    </div>
  )
}
