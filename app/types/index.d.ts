/* eslint-disable no-unused-vars */

import { Submission } from "@conform-to/react"
import { z } from "zod"
import { VerifySchema } from "~/routes/_auth+/verify"
import { Interval, Currency, PricingPlan, PlanId } from "~/constants/index"
import { PlanLimit, Price } from "@prisma/client"

/**
 * A helper type that defines our price by interval.
 */
export type PriceInterval<
	I extends Interval = Interval,
	C extends Currency = Currency,
> = {
		[interval in I]: {
			[currency in C]: Price['amount']
		}
	}

/**
 * A helper type that defines our pricing plans structure by Interval.
 */
export type PricingPlan<T extends PlanId = PlanId> = {
	[key in T]: {
		planID: string
		name: string
		isPopular: boolean
		description: string
		features: string[]
		limits: Pick<PlanLimit, 'maxItems'>
		prices: PriceInterval
	}
}

type BillingPortalProducts = {
	product: PlanId
	prices: string[]
}

// Define a user type for cleaner typing
export type ProviderUser = {
	id: string
	email: string
	username?: string
	name?: string
	imageUrl?: string
}

export type VerifyFunctionArgs = {
	request: Request
	submission: Submission<
		z.input<typeof VerifySchema>,
		string[],
		z.output<typeof VerifySchema>
	>
	body: FormData | URLSearchParams
}

export interface Patient {
	id: string
	userId: string
	name: string
	email: string
	phone: string
	birthDate: Date
	gender: Gender
	address: string
	occupation: string
	emergencyContactName: string
	emergencyContactNumber: string
	primaryPhysician: string
	insuranceProvider: string
	insurancePolicyNumber: string
	allergies: string | undefined
	currentMedication: string | undefined
	familyMedicalHistory: string | undefined
	pastMedicalHistory: string | undefined
	identificationType: string | undefined
	identificationNumber: string | undefined
	identificationDocument: FormData | undefined
	privacyConsent: boolean
}

export interface Appointment {
	patient: Patient
	schedule: Date
	status: Status
	primaryPhysician: string
	reason: string
	note: string
	userId: string
	cancellationReason: string | null
}

export interface User {
	name?: string
	email?: string
	username?: string
	emailVerified?: Date
	image?: string
	role?: string
	provider?: string
}

type SearchParamProps = {
	params: { [key: string]: string }
	searchParams: { [key: string]: string | string[] | undefined }
}

type Gender = 'Male' | 'Female' | 'Other'
type Status = 'pending' | 'scheduled' | 'cancelled'

declare interface CreateUserParams {
	name: string
	email: string
	phone: string
}
// declare interface User extends CreateUserParams {
// 	$id: string
// }

declare interface RegisterUserParams extends CreateUserParams {
	userId: string
	birthDate: Date
	gender: Gender
	address: string
	occupation: string
	emergencyContactName: string
	emergencyContactNumber: string
	primaryPhysician: string
	insuranceProvider: string
	insurancePolicyNumber: string
	allergies: string | undefined
	currentMedication: string | undefined
	familyMedicalHistory: string | undefined
	pastMedicalHistory: string | undefined
	identificationType: string | undefined
	identificationNumber: string | undefined
	identificationDocument: FormData | undefined
	privacyConsent: boolean
}

declare type CreateAppointmentParams = {
	userId: string
	patient: string
	primaryPhysician: string
	reason: string
	schedule: Date
	status: Status
	note: string | undefined
}

declare type UpdateAppointmentParams = {
	appointmentId: string
	userId: string
	appointment: Appointment
	type: string
}
