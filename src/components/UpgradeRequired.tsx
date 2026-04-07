'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { 
  LockClosedIcon, 
  ArrowUpIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface UpgradeRequiredProps {
  moduleName: string;
  moduleIcon: string;
  benefits: string[];
  currentPlan: string;
  requiredPlan: string;
  upgradePrice?: number;
}

export default function UpgradeRequired({
  moduleName,
  moduleIcon,
  benefits,
  currentPlan,
  requiredPlan,
  upgradePrice
}: UpgradeRequiredProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
            <LockClosedIcon className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Lleva tu salón al siguiente nivel
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            El módulo <span className="font-semibold text-blue-600">{moduleName}</span> está disponible en planes superiores
          </p>
          <p className="text-lg text-gray-500">
            Tu plan actual: <span className="font-medium">{currentPlan}</span>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Beneficios del módulo */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{moduleIcon}</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Beneficios de {moduleName}</h2>
                  <p className="text-gray-600">Optimiza tu negocio con herramientas profesionales</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700">{benefit}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Plan requerido */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-blue-900">Plan {requiredPlan}</h2>
                  <p className="text-blue-700">Desbloquea todo el potencial de tu negocio</p>
                </div>
                {upgradePrice && (
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-900">${upgradePrice}</div>
                    <div className="text-sm text-blue-600">/mes</div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Acceso completo a {moduleName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Todas las características del plan anterior</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Soporte técnico prioritario</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Actualizaciones automáticas</span>
                </div>
              </div>

              <div className="mt-6">
                <Link href="/suscripcion">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center gap-2">
                    <ArrowUpIcon className="w-5 h-5" />
                    Mejorar mi Plan
                  </Button>
                </Link>
                <p className="text-sm text-gray-600 text-center mt-3">
                  Cancela en cualquier momento • Sin compromisos
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Características adicionales */}
        <Card className="bg-gray-50">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">¿Por qué actualizar a {requiredPlan}?</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="text-2xl mb-2">📈</div>
                  <h4 className="font-medium text-gray-900 mb-1">Incrementa tus ingresos</h4>
                  <p className="text-sm text-gray-600">Herramientas profesionales para maximizar tu rentabilidad</p>
                </div>
                <div>
                  <div className="text-2xl mb-2">⚡</div>
                  <h4 className="font-medium text-gray-900 mb-1">Ahorra tiempo</h4>
                  <p className="text-sm text-gray-600">Automatización de procesos repetitivos</p>
                </div>
                <div>
                  <div className="text-2xl mb-2">🎯</div>
                  <h4 className="font-medium text-gray-900 mb-1">Toma mejores decisiones</h4>
                  <p className="text-sm text-gray-600">Reportes y análisis detallados de tu negocio</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
